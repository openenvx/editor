import { SANDBOX_BRIDGE_SOURCE } from '@xmazu/openenvxee-extensions/protocol';

/** Isolate bootstrap: `openenvx` host bridge + rate-limited `console` shim. */
export function sandboxBootstrapSource(): string {
  return `
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
    globalThis.console = {
      log: function () { return globalThis.openenvx.call('console', { level: 'log', args: Array.prototype.slice.call(arguments) }); },
      info: function () { return globalThis.openenvx.call('console', { level: 'info', args: Array.prototype.slice.call(arguments) }); },
      warn: function () { return globalThis.openenvx.call('console', { level: 'warn', args: Array.prototype.slice.call(arguments) }); },
      error: function () { return globalThis.openenvx.call('console', { level: 'error', args: Array.prototype.slice.call(arguments) }); },
      debug: function () { return globalThis.openenvx.call('console', { level: 'debug', args: Array.prototype.slice.call(arguments) }); },
    };
  `;
}
