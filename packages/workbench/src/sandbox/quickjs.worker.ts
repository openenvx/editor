/// <reference lib="webworker" />

import type {
  SandboxBridgeRequest,
  SandboxBridgeResponse,
} from '@xmazu/openenvxee-extensions/protocol';

import {
  createQuickJsEngine,
  type QuickJsEngine,
} from './quickjs-isolate-engine';
import type { HostToWorker, WorkerToHost } from './quickjs-worker-protocol';
import { MAX_PENDING_HOST_CALLS } from './sandbox-caps';

declare const self: DedicatedWorkerGlobalScope;

const pendingHost = new Map<
  string,
  {
    resolve: (value: SandboxBridgeResponse) => void;
    reject: (error: Error) => void;
  }
>();

let engine: QuickJsEngine | null = null;
/** Serialize eval + uiMessage — QuickJS context is single-entry. */
let isolateChain: Promise<void> = Promise.resolve();

function post(message: WorkerToHost): void {
  // oxlint-disable-next-line unicorn/require-post-message-target-origin -- DedicatedWorker
  self.postMessage(message);
}

async function ensureEngine(): Promise<QuickJsEngine> {
  if (engine) {
    return engine;
  }
  engine = await createQuickJsEngine({
    onHostCall: (request: SandboxBridgeRequest) => {
      if (pendingHost.size >= MAX_PENDING_HOST_CALLS) {
        return Promise.reject(new Error('Sandbox host call limit exceeded'));
      }
      return new Promise<SandboxBridgeResponse>((resolve, reject) => {
        const callId = Math.random().toString(36).slice(2);
        pendingHost.set(callId, { resolve, reject });
        post({ type: 'hostCall', callId, request });
      });
    },
  });
  return engine;
}

function enqueueIsolateWork(task: () => Promise<void>): void {
  isolateChain = isolateChain.then(task, task);
}

self.onmessage = (event: MessageEvent<HostToWorker>) => {
  const message = event.data;
  if (message.type === 'dispose') {
    for (const pending of pendingHost.values()) {
      pending.reject(new Error('Sandbox disposed'));
    }
    pendingHost.clear();
    engine?.dispose();
    engine = null;
    isolateChain = Promise.resolve();
    return;
  }
  if (message.type === 'hostResult') {
    const pending = pendingHost.get(message.callId);
    if (!pending) {
      return;
    }
    pendingHost.delete(message.callId);
    pending.resolve(message.response);
    return;
  }

  if (message.type === 'uiMessage') {
    enqueueIsolateWork(async () => {
      try {
        const qjs = await ensureEngine();
        qjs.deliverUiMessage(message.payload);
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        post({ type: 'fatal', error: text });
      }
    });
    return;
  }

  if (message.type === 'eval') {
    enqueueIsolateWork(async () => {
      try {
        const qjs = await ensureEngine();
        const result = await qjs.evalModule(message.source);
        post({ type: 'evalDone', requestId: message.requestId, result });
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        post({
          type: 'evalError',
          requestId: message.requestId,
          error: text,
        });
      }
    });
  }
};

post({ type: 'ready' });
