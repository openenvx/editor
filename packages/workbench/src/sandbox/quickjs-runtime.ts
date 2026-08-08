import type {
  SandboxBridgeRequest,
  SandboxBridgeResponse,
} from '@xmazu/openenvxee-extensions/protocol';

import { createQuickJsEngine } from './quickjs-isolate-engine';
import type { HostToWorker, WorkerToHost } from './quickjs-worker-protocol';
import {
  SANDBOX_EVAL_TIMEOUT_MS,
  SANDBOX_WORKER_READY_MS,
} from './sandbox-caps';

export { SANDBOX_EVAL_TIMEOUT_MS } from './sandbox-caps';

export interface SandboxIsolate {
  evalModule: (source: string) => Promise<unknown>;
  deliverUiMessage: (payload: unknown) => void;
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
  // Source / Vite HMR: import.meta.url ends in .ts → co-located TypeScript worker.
  // Published dist (flat or preserveModules) ends in .js — even when the path still
  // contains /src/ — so load sandbox-worker.js beside this module.
  const meta = import.meta.url;
  if (/\.tsx?([?#]|$)/.test(meta)) {
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
  /** Override in-process CPU budget (tests). */
  cpuLimitMs?: number;
  /** Fired when the Worker is killed (eval timeout / fatal). */
  onTerminated?: (reason: Error) => void;
}): Promise<SandboxIsolate> {
  if (input.preferInProcess) {
    return createQuickJsEngine({
      onHostCall: input.onHostCall,
      cpuLimitMs: input.cpuLimitMs,
    });
  }

  if (!canUseWorker()) {
    throw new Error(
      'Sandbox requires a Web Worker. In-process isolate is test-only (preferInProcess: true).'
    );
  }

  return createWorkerIsolate(
    input.onHostCall,
    resolveWorkerUrl(input.workerUrl),
    input.onTerminated
  );
}

async function createWorkerIsolate(
  onHostCall: BridgeHandler,
  workerUrl: URL,
  onTerminated?: (reason: Error) => void
): Promise<SandboxIsolate> {
  const worker = new Worker(workerUrl, { type: 'module' });

  const pendingEval = new Map<
    string,
    {
      resolve: (result: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  let disposed = false;
  let readySettled = false;

  let onMessage: ((event: MessageEvent<WorkerToHost>) => void) | null = null;

  const terminateAll = (reason: Error): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    worker.terminate();
    for (const pending of pendingEval.values()) {
      clearTimeout(pending.timer);
      pending.reject(reason);
    }
    pendingEval.clear();
    onTerminated?.(reason);
  };

  const ready = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Sandbox worker ready timeout (${workerUrl.href})`));
    }, SANDBOX_WORKER_READY_MS);

    onMessage = (event: MessageEvent<WorkerToHost>) => {
      const message = event.data;
      if (message.type === 'ready') {
        clearTimeout(timeout);
        readySettled = true;
        resolve();
        return;
      }
      if (message.type === 'fatal') {
        clearTimeout(timeout);
        const error = new Error(message.error);
        if (!readySettled) {
          reject(error);
          return;
        }
        terminateAll(error);
        return;
      }
      if (message.type === 'hostCall') {
        void onHostCall(message.request)
          .then((response) => {
            if (disposed) {
              return;
            }
            postToWorker(worker, {
              type: 'hostResult',
              callId: message.callId,
              response,
            });
          })
          .catch((error) => {
            if (disposed) {
              return;
            }
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
        const pending = pendingEval.get(message.requestId);
        if (!pending) {
          return;
        }
        clearTimeout(pending.timer);
        pending.resolve(message.result);
        pendingEval.delete(message.requestId);
        return;
      }
      if (message.type === 'evalError') {
        const pending = pendingEval.get(message.requestId);
        if (!pending) {
          return;
        }
        clearTimeout(pending.timer);
        pending.reject(new Error(message.error));
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
      if (disposed) {
        return Promise.reject(new Error('Sandbox disposed'));
      }
      const requestId = Math.random().toString(36).slice(2);
      return new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingEval.delete(requestId);
          const reason = new Error('Sandbox eval timeout');
          terminateAll(reason);
          reject(reason);
        }, SANDBOX_EVAL_TIMEOUT_MS);
        pendingEval.set(requestId, { resolve, reject, timer });
        postToWorker(worker, { type: 'eval', requestId, source });
      });
    },
    deliverUiMessage(payload: unknown) {
      if (disposed) {
        return;
      }
      postToWorker(worker, { type: 'uiMessage', payload });
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      postToWorker(worker, { type: 'dispose' });
      worker.terminate();
      for (const pending of pendingEval.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('Sandbox disposed'));
      }
      pendingEval.clear();
    },
  };
}
