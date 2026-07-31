import type {
  SandboxBridgeRequest,
  SandboxBridgeResponse,
} from '@xmazu/openenvxee-plugin-protocol';

export type WorkerToHost =
  | { type: 'ready' }
  | { type: 'evalDone'; requestId: string }
  | { type: 'evalError'; requestId: string; error: string }
  | {
      type: 'hostCall';
      callId: string;
      request: SandboxBridgeRequest;
    }
  | { type: 'fatal'; error: string };

export type HostToWorker =
  | { type: 'eval'; requestId: string; source: string }
  | { type: 'hostResult'; callId: string; response: SandboxBridgeResponse }
  | { type: 'dispose' };
