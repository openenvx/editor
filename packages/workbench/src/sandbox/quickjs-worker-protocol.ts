import type {
  SandboxBridgeRequest,
  SandboxBridgeResponse,
} from '@openenvx/protocol';

export type WorkerToHost =
  | { type: 'ready' }
  | { type: 'evalDone'; requestId: string; result?: unknown }
  | { type: 'evalError'; requestId: string; error: string }
  | {
      type: 'hostCall';
      callId: string;
      request: SandboxBridgeRequest;
    }
  | { type: 'fatal'; error: string };

export type HostToWorker =
  | { type: 'eval'; requestId: string; source: string }
  | { type: 'uiMessage'; payload: unknown }
  | { type: 'hostResult'; callId: string; response: SandboxBridgeResponse }
  | { type: 'dispose' };
