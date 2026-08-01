import {
  SANDBOX_BRIDGE_SOURCE,
  type SandboxBridgeRequest,
  type SandboxBridgeResponse,
} from '@xmazu/openenvxee-protocol';

import {
  SANDBOX_CPU_LIMIT_MS,
  SANDBOX_MEMORY_LIMIT_BYTES,
} from './sandbox-caps';

export type HostCallFn = (
  request: SandboxBridgeRequest
) => Promise<SandboxBridgeResponse>;

export interface QuickJsEngine {
  evalModule: (source: string) => Promise<unknown>;
  deliverUiMessage: (payload: unknown) => void;
  dispose: () => void;
}

export { SANDBOX_CPU_LIMIT_MS } from './sandbox-caps';

/**
 * Runs one QuickJS isolate. Call only from a Worker (or test fallback).
 * Extension JS never touches the editor main world.
 */
export async function createQuickJsEngine(input: {
  onHostCall: HostCallFn;
  /** Override CPU budget (tests). */
  cpuLimitMs?: number;
}): Promise<QuickJsEngine> {
  const cpuLimitMs = input.cpuLimitMs ?? SANDBOX_CPU_LIMIT_MS;
  const quickjs = await import('quickjs-emscripten');
  const QuickJS = await quickjs.getQuickJS();
  const runtime = QuickJS.newRuntime();
  // Soft ceiling; upgrade path: per-extension memory budget from mint grant.
  runtime.setMemoryLimit(SANDBOX_MEMORY_LIMIT_BYTES);

  let deadlineMs = Number.POSITIVE_INFINITY;
  runtime.setInterruptHandler(() => Date.now() >= deadlineMs);

  const context = runtime.newContext();

  const withCpuBudget = <T>(fn: () => T): T => {
    deadlineMs = Date.now() + cpuLimitMs;
    try {
      return fn();
    } finally {
      deadlineMs = Number.POSITIVE_INFINITY;
    }
  };

  const formatEvalError = (errorHandle: { dispose: () => void }): string => {
    const dumped = context.dump(errorHandle as never);
    errorHandle.dispose();
    if (typeof dumped === 'string') {
      return dumped;
    }
    if (dumped && typeof dumped === 'object') {
      const record = dumped as { message?: unknown; name?: unknown };
      const parts = [record.name, record.message].filter(
        (part) => part !== undefined && part !== null && part !== ''
      );
      if (parts.length > 0) {
        return parts.map(String).join(': ');
      }
      try {
        return JSON.stringify(dumped);
      } catch {
        return String(dumped);
      }
    }
    return String(dumped);
  };

  const assertEvalOk = (result: {
    error?: { dispose: () => void };
    value?: { dispose: () => void } | null;
  }): void => {
    if (result.error) {
      const text = formatEvalError(result.error);
      if (/interrupt/i.test(text)) {
        throw new Error('Sandbox CPU limit exceeded');
      }
      throw new Error(`Sandbox eval failed: ${text}`);
    }
    try {
      result.value?.dispose();
    } catch {
      // Handle already freed.
    }
  };

  const dumpEvalResult = (result: {
    error?: { dispose: () => void };
    value?: { dispose: () => void } | null;
  }): unknown => {
    if (result.error) {
      const text = formatEvalError(result.error);
      if (/interrupt/i.test(text)) {
        throw new Error('Sandbox CPU limit exceeded');
      }
      throw new Error(`Sandbox eval failed: ${text}`);
    }
    if (!result.value) {
      return undefined;
    }
    try {
      return context.dump(result.value as never);
    } finally {
      try {
        result.value.dispose();
      } catch {
        // Handle already freed by dump/runtime.
      }
    }
  };

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
        withCpuBudget(() => {
          context.runtime.executePendingJobs();
        });
      }
    })();
    return promise.handle;
  });
  context.setProp(context.global, '__openenvxHostCall', hostHandle);
  hostHandle.dispose();

  const bootstrap = `
    globalThis.openenvx = {
      ui: {
        onmessage: null,
        postMessage(pluginMessage) {
          return globalThis.openenvx.call('postToUI', { pluginMessage });
        },
      },
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
      _denyDuringFaceRender(method) {
        if (this.widget && this.widget.rendering) {
          throw new Error(method + ' is not allowed during widget face render');
        }
      },
      getSelection() { return this.call('getSelection'); },
      getPageId() { return this.call('getPageId'); },
      executeCommand(commandId, args) {
        this._denyDuringFaceRender('executeCommand');
        return this.call('executeCommand', { commandId, args });
      },
      showUI(html, options) {
        this._denyDuringFaceRender('showUI');
        return this.call('showUI', { html, ...(options || {}) });
      },
      resizeUI(width, height) {
        return this.call('resizeUI', { width, height });
      },
      closeUI() { return this.call('closeUI'); },
      notify(message) {
        this._denyDuringFaceRender('notify');
        return this.call('notify', { message });
      },
      closePlugin() {
        this._denyDuringFaceRender('closePlugin');
        return this.call('closePlugin');
      },
      getClientStorage(key) { return this.call('getClientStorage', { key }); },
      setClientStorage(key, value) {
        this._denyDuringFaceRender('setClientStorage');
        return this.call('setClientStorage', { key, value });
      },
      getSyncedState() { return this.call('getSyncedState'); },
      setSyncedState(value) { return this.call('setSyncedState', { value }); },
      resizeWidget(width, height) {
        this._denyDuringFaceRender('resizeWidget');
        return this.call('resizeWidget', { width, height });
      },
      widget: {
        _registry: Object.create(null),
        _handlersByLayer: Object.create(null),
        _renderValues: null,
        rendering: false,
        applyProps: null,
        _endRenderPass: null,
        register(entry) {
          if (!entry || typeof entry !== 'object') {
            throw new Error('openenvx.widget.register expects an entry');
          }
          var id = entry.id || (entry.manifest && entry.manifest.id);
          if (!id || typeof id !== 'string') {
            throw new Error('openenvx.widget.register requires id');
          }
          this._registry[id] = entry;
        },
        useSyncedState(key, init) {
          var values = this._renderValues;
          var current =
            values && typeof values === 'object' && Object.prototype.hasOwnProperty.call(values, key)
              ? values[key]
              : (typeof init === 'function' ? init() : init);
          var set = function (next) {
            var resolved = typeof next === 'function' ? next(current) : next;
            current = resolved;
            var patch = {};
            patch[key] = resolved;
            var apply = globalThis.openenvx.widget.applyProps;
            if (typeof apply === 'function') {
              return apply(patch);
            }
            return globalThis.openenvx.getSyncedState().then(function (live) {
              var bag =
                live && typeof live === 'object' && !Array.isArray(live)
                  ? Object.assign({}, live)
                  : {};
              bag[key] = resolved;
              return globalThis.openenvx.setSyncedState(bag);
            });
          };
          return [current, set];
        },
      },
    };
  `;
  try {
    const bootResult = withCpuBudget(() => context.evalCode(bootstrap));
    assertEvalOk(bootResult);
  } catch (error) {
    context.dispose();
    runtime.dispose();
    const text = error instanceof Error ? error.message : String(error);
    throw new Error(
      text.startsWith('Sandbox ')
        ? text.replace(/^Sandbox eval failed/, 'Sandbox bootstrap failed')
        : `Sandbox bootstrap failed: ${text}`,
      { cause: error }
    );
  }

  const endHeldRenderPass = (): void => {
    withCpuBudget(() => {
      const result = context.evalCode(`(function () {
        var w = globalThis.openenvx && globalThis.openenvx.widget;
        if (w && typeof w._endRenderPass === 'function') {
          w._endRenderPass();
        }
      })()`);
      assertEvalOk(result);
    });
  };

  return {
    async evalModule(source: string) {
      try {
        const result = withCpuBudget(() => context.evalCode(source));
        const dumped = dumpEvalResult(result);
        // Drain microtasks while face-render hold is still active.
        withCpuBudget(() => {
          context.runtime.executePendingJobs();
        });
        return dumped;
      } finally {
        endHeldRenderPass();
      }
    },
    deliverUiMessage(payload: unknown) {
      const encoded = JSON.stringify(payload ?? null);
      try {
        const result = withCpuBudget(() =>
          context.evalCode(
            `(function (payload) {
            const ui = globalThis.openenvx && globalThis.openenvx.ui;
            if (ui && typeof ui.onmessage === 'function') {
              ui.onmessage(payload);
            }
          })(${encoded})`
          )
        );
        assertEvalOk(result);
        withCpuBudget(() => {
          context.runtime.executePendingJobs();
        });
      } finally {
        endHeldRenderPass();
      }
    },
    dispose() {
      deadlineMs = Number.POSITIVE_INFINITY;
      context.dispose();
      runtime.dispose();
    },
  };
}
