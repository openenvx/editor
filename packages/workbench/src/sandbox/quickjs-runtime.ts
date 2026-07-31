import type {
  SandboxBridgeRequest,
  SandboxBridgeResponse,
} from '@xmazu/openenvxee-plugin-protocol';

import { createQuickJsEngine } from './quickjs-isolate-engine';
import type { HostToWorker, WorkerToHost } from './quickjs-worker-protocol';

export interface SandboxIsolate {
  evalModule: (source: string) => Promise<void>;
  dispose: () => void;
}

type BridgeHandler = (
  request: SandboxBridgeRequest
) => Promise<SandboxBridgeResponse>;

function canUseWorker(): boolean {
  return typeof Worker !== 'undefined' && typeof URL !== 'undefined';
}

function resolveWorkerUrl(override?: string | URL): URL {
  if (override !== undefined) {
    return typeof override === 'string'
      ? new URL(override, import.meta.url)
      : override;
  }
  // Source / Vite HMR: co-located TypeScript worker.
  // Studio dist bundle: sandbox-worker.js next to the consuming entry.
  const meta = import.meta.url;
  if (meta.includes('/src/') || /\.tsx?([?#]|$)/.test(meta)) {
    return new URL('quickjs.worker.ts', meta);
  }
  return new URL('sandbox-worker.js', meta);
}

function postToWorker(worker: Worker, message: HostToWorker): void {
  // DedicatedWorker.postMessage has no targetOrigin (Window-only).
  // oxlint-disable-next-line unicorn/require-post-message-target-origin -- Worker API
  worker.postMessage(message);
}

/**
 * Creates one QuickJS isolate in a dedicated Web Worker (Figma-style).
 * In-process isolate is test-only (`preferInProcess: true`) — never a silent fallback.
 */
export async function createQuickJsIsolate(input: {
  onHostCall: BridgeHandler;
  /** Force in-process isolate (unit tests only). */
  preferInProcess?: boolean;
  /** Absolute worker URL; defaults to co-located worker / studio dist entry. */
  workerUrl?: string | URL;
}): Promise<SandboxIsolate> {
  if (input.preferInProcess) {
    return createQuickJsEngine({ onHostCall: input.onHostCall });
  }

  if (!canUseWorker()) {
    throw new Error(
      'Sandbox requires a Web Worker. In-process isolate is test-only (preferInProcess: true).'
    );
  }

  return createWorkerIsolate(
    input.onHostCall,
    resolveWorkerUrl(input.workerUrl)
  );
}

async function createWorkerIsolate(
  onHostCall: BridgeHandler,
  workerUrl: URL
): Promise<SandboxIsolate> {
  const worker = new Worker(workerUrl, { type: 'module' });

  const pendingEval = new Map<
    string,
    { resolve: () => void; reject: (error: Error) => void }
  >();

  let onMessage: ((event: MessageEvent<WorkerToHost>) => void) | null = null;

  const ready = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Sandbox worker ready timeout (${workerUrl.href})`));
    }, 15_000);

    onMessage = (event: MessageEvent<WorkerToHost>) => {
      const message = event.data;
      if (message.type === 'ready') {
        clearTimeout(timeout);
        resolve();
        return;
      }
      if (message.type === 'fatal') {
        clearTimeout(timeout);
        reject(new Error(message.error));
        return;
      }
      if (message.type === 'hostCall') {
        void onHostCall(message.request)
          .then((response) => {
            postToWorker(worker, {
              type: 'hostResult',
              callId: message.callId,
              response,
            });
          })
          .catch((error) => {
            postToWorker(worker, {
              type: 'hostResult',
              callId: message.callId,
              response: {
                source: message.request.source,
                v: 1,
                id: message.request.id,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
              },
            });
          });
        return;
      }
      if (message.type === 'evalDone') {
        pendingEval.get(message.requestId)?.resolve();
        pendingEval.delete(message.requestId);
        return;
      }
      if (message.type === 'evalError') {
        pendingEval.get(message.requestId)?.reject(new Error(message.error));
        pendingEval.delete(message.requestId);
      }
    };
    worker.onmessage = onMessage;
    worker.onerror = (event) => {
      clearTimeout(timeout);
      reject(event.error ?? new Error(event.message || 'Sandbox worker error'));
    };
  });

  try {
    await ready;
  } catch (error) {
    worker.terminate();
    throw error instanceof Error
      ? error
      : new Error(`Sandbox worker failed to start: ${String(error)}`);
  }

  return {
    evalModule(source: string) {
      const requestId = Math.random().toString(36).slice(2);
      return new Promise<void>((resolve, reject) => {
        pendingEval.set(requestId, { resolve, reject });
        postToWorker(worker, { type: 'eval', requestId, source });
      });
    },
    dispose() {
      postToWorker(worker, { type: 'dispose' });
      worker.terminate();
      for (const pending of pendingEval.values()) {
        pending.reject(new Error('Sandbox disposed'));
      }
      pendingEval.clear();
    },
  };
}
