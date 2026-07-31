import {
  SANDBOX_BRIDGE_SOURCE,
  type SandboxBridgeRequest,
  type SandboxBridgeResponse,
} from '@xmazu/openenvxee-plugin-protocol';

export type HostCallFn = (
  request: SandboxBridgeRequest
) => Promise<SandboxBridgeResponse>;

export interface QuickJsEngine {
  evalModule: (source: string) => Promise<void>;
  dispose: () => void;
}

/**
 * Runs one QuickJS isolate. Call only from a Worker (or test fallback).
 * Extension JS never touches the editor main world.
 */
export async function createQuickJsEngine(input: {
  onHostCall: HostCallFn;
}): Promise<QuickJsEngine> {
  const quickjs = await import('quickjs-emscripten');
  const QuickJS = await quickjs.getQuickJS();
  const runtime = QuickJS.newRuntime();
  // Soft ceiling; upgrade path: per-extension memory budget from mint grant.
  runtime.setMemoryLimit(8 * 1024 * 1024);
  const context = runtime.newContext();

  const hostHandle = context.newFunction('__openenvxHostCall', (reqHandle) => {
    const raw = context.dump(reqHandle);
    const promise = context.newPromise();
    void (async () => {
      try {
        const request = raw as SandboxBridgeRequest;
        if (
          !request ||
          typeof request !== 'object' ||
          request.source !== SANDBOX_BRIDGE_SOURCE
        ) {
          throw new Error('Invalid host call');
        }
        const response = await input.onHostCall(request);
        const value = context.newString(JSON.stringify(response));
        promise.resolve(value);
        value.dispose();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const value = context.newString(
          JSON.stringify({
            source: SANDBOX_BRIDGE_SOURCE,
            v: 1,
            id: 'error',
            ok: false,
            error: message,
          } satisfies SandboxBridgeResponse)
        );
        promise.resolve(value);
        value.dispose();
      } finally {
        context.runtime.executePendingJobs();
      }
    })();
    return promise.handle;
  });
  context.setProp(context.global, '__openenvxHostCall', hostHandle);
  hostHandle.dispose();

  const bootstrap = `
    globalThis.openenvx = {
      async call(method, params) {
        const id = Math.random().toString(36).slice(2);
        const raw = await globalThis.__openenvxHostCall({
          source: '${SANDBOX_BRIDGE_SOURCE}',
          v: 1,
          id,
          method,
          params: params ?? null,
        });
        const response = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!response.ok) {
          throw new Error(response.error || 'Host call failed');
        }
        return response.result;
      },
      getSelection() { return this.call('getSelection'); },
      getPageId() { return this.call('getPageId'); },
      executeCommand(commandId, args) {
        return this.call('executeCommand', { commandId, args });
      },
      showUI(html, options) {
        return this.call('showUI', { html, ...(options || {}) });
      },
      resizeUI(width, height) {
        return this.call('resizeUI', { width, height });
      },
      closeUI() { return this.call('closeUI'); },
      notify(message) { return this.call('notify', { message }); },
      closePlugin() { return this.call('closePlugin'); },
      getClientStorage(key) { return this.call('getClientStorage', { key }); },
      setClientStorage(key, value) {
        return this.call('setClientStorage', { key, value });
      },
      onClick(handler) {
        globalThis.__openenvxOnClick = handler;
      },
      getSyncedState() { return this.call('getSyncedState'); },
      setSyncedState(value) { return this.call('setSyncedState', { value }); },
      resizeWidget(width, height) {
        return this.call('resizeWidget', { width, height });
      },
    };
  `;
  const bootResult = context.evalCode(bootstrap);
  if (bootResult.error) {
    const message = context.dump(bootResult.error);
    bootResult.error.dispose();
    context.dispose();
    runtime.dispose();
    throw new Error(`Sandbox bootstrap failed: ${String(message)}`);
  }
  bootResult.value?.dispose();

  return {
    async evalModule(source: string) {
      const result = context.evalCode(source, { type: 'global' });
      if (result.error) {
        const message = context.dump(result.error);
        result.error.dispose();
        throw new Error(`Sandbox eval failed: ${String(message)}`);
      }
      result.value?.dispose();
      context.runtime.executePendingJobs();
    },
    dispose() {
      context.dispose();
      runtime.dispose();
    },
  };
}
