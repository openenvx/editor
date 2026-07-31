import {
  SANDBOX_BRIDGE_SOURCE,
  type SandboxBridgeRequest,
  type SandboxBridgeResponse,
  type SandboxExtensionGrant,
  type SandboxHostMethod,
} from '@xmazu/openenvxee-plugin-protocol';

import { assertJsonSerializable, assertMethodAllowed } from './capabilities';

export interface SandboxHostHandlers {
  getSelection: () => Promise<unknown> | unknown;
  getPageId: () => Promise<unknown> | unknown;
  executeCommand: (
    commandId: string,
    args: unknown
  ) => Promise<unknown> | unknown;
  showUI: (
    html: string,
    options?: { width?: number; height?: number }
  ) => Promise<void> | void;
  resizeUI: (width: number, height: number) => Promise<void> | void;
  closeUI: () => Promise<void> | void;
  notify: (message: string) => Promise<void> | void;
  closePlugin: () => Promise<void> | void;
  getClientStorage: (key: string) => Promise<unknown> | unknown;
  setClientStorage: (key: string, value: unknown) => Promise<void> | void;
  getSyncedState: () => Promise<unknown> | unknown;
  setSyncedState: (value: unknown) => Promise<void> | void;
  resizeWidget: (width: number, height: number) => Promise<void> | void;
}

export function createSandboxHostBridge(input: {
  grant: SandboxExtensionGrant;
  permission: 'read' | 'edit';
  handlers: SandboxHostHandlers;
}) {
  return {
    async handle(
      request: SandboxBridgeRequest
    ): Promise<SandboxBridgeResponse> {
      if (request.source !== SANDBOX_BRIDGE_SOURCE || request.v !== 1) {
        return {
          source: SANDBOX_BRIDGE_SOURCE,
          v: 1,
          id: request.id,
          ok: false,
          error: 'Invalid bridge envelope',
        };
      }

      try {
        assertJsonSerializable(request.params ?? null, 'params');
        const method = request.method;
        const params = (request.params ?? {}) as Record<string, unknown>;
        const commandId =
          method === 'executeCommand' && typeof params.commandId === 'string'
            ? params.commandId
            : undefined;
        assertMethodAllowed({
          grant: input.grant,
          method,
          permission: input.permission,
          commandId,
        });

        const result = await dispatch(method, params, input.handlers);
        assertJsonSerializable(result ?? null, 'result');
        return {
          source: SANDBOX_BRIDGE_SOURCE,
          v: 1,
          id: request.id,
          ok: true,
          result: result ?? null,
        };
      } catch (error) {
        return {
          source: SANDBOX_BRIDGE_SOURCE,
          v: 1,
          id: request.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

function clampUiSize(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(n), 4096);
}

async function dispatch(
  method: SandboxHostMethod,
  params: Record<string, unknown>,
  handlers: SandboxHostHandlers
): Promise<unknown> {
  switch (method) {
    case 'getSelection': {
      return handlers.getSelection();
    }
    case 'getPageId': {
      return handlers.getPageId();
    }
    case 'executeCommand': {
      return handlers.executeCommand(
        String(params.commandId ?? ''),
        params.args ?? null
      );
    }
    case 'showUI': {
      return handlers.showUI(String(params.html ?? ''), {
        width: clampUiSize(params.width, 320),
        height: clampUiSize(params.height, 240),
      });
    }
    case 'resizeUI': {
      return handlers.resizeUI(
        clampUiSize(params.width, 320),
        clampUiSize(params.height, 240)
      );
    }
    case 'closeUI': {
      return handlers.closeUI();
    }
    case 'notify': {
      return handlers.notify(String(params.message ?? ''));
    }
    case 'closePlugin': {
      return handlers.closePlugin();
    }
    case 'getClientStorage': {
      return handlers.getClientStorage(String(params.key ?? ''));
    }
    case 'setClientStorage': {
      return handlers.setClientStorage(String(params.key ?? ''), params.value);
    }
    case 'getSyncedState': {
      return handlers.getSyncedState();
    }
    case 'setSyncedState': {
      return handlers.setSyncedState(params.value);
    }
    case 'resizeWidget': {
      return handlers.resizeWidget(
        clampUiSize(params.width, 1),
        clampUiSize(params.height, 1)
      );
    }
    default: {
      const _exhaustive: never = method;
      throw new Error(`Unknown method: ${String(_exhaustive)}`);
    }
  }
}
