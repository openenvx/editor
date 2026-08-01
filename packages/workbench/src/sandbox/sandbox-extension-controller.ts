import type { SandboxHostSurface } from '@openenvx/headless';
import type {
  SandboxExtensionGrant,
  SandboxBridgeRequest,
  SandboxUiSelection,
} from '@xmazu/openenvxee-protocol';

import {
  freezeGrant,
  assertUiMessagePolicy,
  hasCapability,
} from './capabilities';
import { fetchAndVerifyArtifact } from './fetch-artifact';
import {
  createSandboxHostBridge,
  type SandboxHostHandlers,
} from './host-bridge';
import { createQuickJsIsolate, type SandboxIsolate } from './quickjs-runtime';
import {
  assertNotifyPolicy,
  MAX_CONCURRENT_ISOLATES,
  MAX_SHOW_UI_HTML_CHARS,
  MAX_WIDGET_VALUES_JSON_CHARS,
} from './sandbox-caps';

export {
  assertNotifyPolicy,
  MAX_CONCURRENT_ISOLATES,
  MAX_NOTIFY_MESSAGE_CHARS,
  MAX_NOTIFY_PER_SECOND,
  MAX_SHOW_UI_HTML_CHARS,
} from './sandbox-caps';
export { assertUiMessagePolicy } from './capabilities';

export interface SandboxUiState {
  extensionId: string;
  html: string;
  width: number;
  height: number;
  kind: 'plugin' | 'widget';
  layerId?: string;
}

export type SandboxUiListener = (state: SandboxUiState | null) => void;

export interface SandboxNotifyEvent {
  id: string;
  extensionId: string;
  message: string;
}

export type SandboxNotifyListener = (event: SandboxNotifyEvent) => void;

/** Isolate → showUI iframe (React owns the contentWindow). */
export type SandboxUiOutboundListener = (pluginMessage: unknown) => void;

export type SandboxUiContextListener = () => void;

const MAX_CLIENT_STORAGE_KEYS = 64;
const MAX_CLIENT_STORAGE_VALUE_CHARS = 32_768;

function isolateKey(extensionId: string, layerId?: string): string {
  // Widgets share one isolate per extension (mounted roots per instance).
  // Plugins still use extensionId only (layerId ignored).
  void layerId;
  return extensionId;
}

export class SandboxExtensionController {
  private readonly isolates = new Map<string, SandboxIsolate>();
  /** Keys reserved while fetch/worker/eval are in flight (TOCTOU guard). */
  private readonly starting = new Set<string>();
  private readonly clientStorage = new Map<string, unknown>();
  private readonly grantById = new Map<string, SandboxExtensionGrant>();
  private readonly notifyTimestamps = new Map<string, number[]>();
  private uiState: SandboxUiState | null = null;
  private readonly uiListeners = new Set<SandboxUiListener>();
  private readonly notifyListeners = new Set<SandboxNotifyListener>();
  private readonly uiOutboundListeners = new Set<SandboxUiOutboundListener>();
  private readonly uiContextListeners = new Set<SandboxUiContextListener>();
  private disposed = false;
  private notifySeq = 0;
  /**
   * Active widget layer for bridge values/resize/showUI.
   * Set only while render/invoke runs — never fall back to a baked start() id
   * (shared per-extension isolates serve many layer instances).
   */
  private activeWidgetLayerId: string | null = null;
  /** Serialize widget face/handler ops so concurrent instances cannot cross-wire. */
  private widgetOpTail: Promise<void> = Promise.resolve();

  constructor(
    private readonly options: {
      grants: SandboxExtensionGrant[];
      permission: 'read' | 'edit';
      host: SandboxHostSurface;
      fetchImpl?: typeof fetch;
      workerUrl?: string | URL;
      /** Test-only: allow in-process QuickJS (never for production hosts). */
      preferInProcess?: boolean;
      /** Resolve widget layer `data.values` by layer id. */
      getWidgetValues?: (layerId: string) => unknown;
      setWidgetValues?: (layerId: string, value: unknown) => void;
      resizeWidgetLayer?: (
        layerId: string,
        width: number,
        height: number
      ) => void;
    }
  ) {
    for (const grant of options.grants) {
      const frozen = freezeGrant(grant);
      this.grantById.set(frozen.id, frozen);
    }
  }

  subscribeUi(listener: SandboxUiListener): () => void {
    this.uiListeners.add(listener);
    listener(this.uiState);
    return () => this.uiListeners.delete(listener);
  }

  subscribeNotify(listener: SandboxNotifyListener): () => void {
    this.notifyListeners.add(listener);
    return () => this.notifyListeners.delete(listener);
  }

  /** Isolate `postToUI` → React posts into the iframe when ready. */
  subscribeUiOutbound(listener: SandboxUiOutboundListener): () => void {
    this.uiOutboundListeners.add(listener);
    return () => this.uiOutboundListeners.delete(listener);
  }

  /** Fired when selection (or host) wants showUI context refreshed. */
  subscribeUiContext(listener: SandboxUiContextListener): () => void {
    this.uiContextListeners.add(listener);
    return () => this.uiContextListeners.delete(listener);
  }

  /** Call when scene selection changes so open showUI gets a context push. */
  notifyUiContextChanged(): void {
    for (const listener of this.uiContextListeners) {
      listener();
    }
  }

  /**
   * Selection for showUI context. Requires `document:read` on the grant
   * (same gate as `getSelection`); otherwise `null` (omit from `ui:context`).
   */
  getUiContextSelection(extensionId?: string): SandboxUiSelection | null {
    if (extensionId) {
      const grant = this.grantById.get(extensionId);
      if (!(grant && hasCapability(grant, 'document:read'))) {
        return null;
      }
    }
    const selection = this.options.host.getSelection();
    return {
      activePageId: selection.activePageId,
      selectedLayerIds: [...selection.selectedLayerIds],
      primaryLayerId: selection.primaryLayerId,
    };
  }

  getUiState(): SandboxUiState | null {
    return this.uiState;
  }

  /** Close the floating UI panel only — does not stop the isolate. */
  closeUi(extensionId?: string, layerId?: string): void {
    if (!this.uiState) {
      return;
    }
    if (extensionId !== undefined && this.uiState.extensionId !== extensionId) {
      return;
    }
    if (layerId !== undefined && this.uiState.layerId !== layerId) {
      return;
    }
    this.setUi(null);
  }

  /**
   * Deliver a JSON-cloned UI message to the running isolate for this extension.
   * Path B: iframe → host → isolate `openenvx.ui.onmessage`.
   */
  deliverUiMessage(
    extensionId: string,
    layerId: string | undefined,
    message: unknown
  ): void {
    if (this.disposed) {
      return;
    }
    try {
      assertUiMessagePolicy(message);
    } catch {
      return;
    }
    const key = isolateKey(extensionId, layerId);
    const isolate =
      this.isolates.get(key) ?? this.isolates.get(extensionId) ?? null;
    if (!isolate) {
      return;
    }
    try {
      isolate.deliverUiMessage(message);
    } catch (error) {
      console.error('[sandbox] ui message delivery failed', extensionId, error);
    }
  }

  async startAll(): Promise<void> {
    for (const grant of this.grantById.values()) {
      await this.start(grant);
    }
  }

  async start(grant: SandboxExtensionGrant, layerId?: string): Promise<void> {
    if (this.disposed) {
      return;
    }
    const frozen = this.grantById.get(grant.id);
    if (!frozen) {
      throw new Error(`Unknown sandbox grant: ${grant.id}`);
    }
    const key = isolateKey(frozen.id, layerId);
    if (this.isolates.has(key) || this.starting.has(key)) {
      return;
    }
    if (this.isolates.size + this.starting.size >= MAX_CONCURRENT_ISOLATES) {
      throw new Error('Sandbox isolate limit exceeded');
    }

    this.starting.add(key);
    try {
      let source: string;
      if (typeof frozen.source === 'string' && frozen.source.length > 0) {
        source = frozen.source;
      } else if (frozen.artifactUrl && frozen.contentHash) {
        source = await fetchAndVerifyArtifact({
          url: frozen.artifactUrl,
          contentHash: frozen.contentHash,
          fetchImpl: this.options.fetchImpl,
        });
      } else {
        throw new Error(`Sandbox grant ${frozen.id} has no source or artifact`);
      }
      if (this.disposed) {
        return;
      }

      const handlers = this.createHandlers(frozen, layerId);
      const bridge = createSandboxHostBridge({
        grant: frozen,
        permission: this.options.permission,
        handlers,
      });

      const isolateRef: { current: SandboxIsolate | null } = { current: null };
      const isolate = await createQuickJsIsolate({
        onHostCall: (request: SandboxBridgeRequest) => bridge.handle(request),
        workerUrl: this.options.workerUrl,
        preferInProcess: this.options.preferInProcess,
        onTerminated: () => {
          if (
            isolateRef.current &&
            this.isolates.get(key) === isolateRef.current
          ) {
            this.isolates.delete(key);
          }
        },
      });
      isolateRef.current = isolate;
      if (this.disposed) {
        isolate.dispose();
        return;
      }

      try {
        await isolate.evalModule(source);
      } catch (error) {
        isolate.dispose();
        throw error;
      }

      this.isolates.set(key, isolate);
    } finally {
      this.starting.delete(key);
    }
  }

  /**
   * Push widget source from the parent page (no artifact fetch).
   * Requires an existing grant — does not mint capabilities.
   */
  async pushWidgetSource(extensionId: string, source: string): Promise<void> {
    const existing = this.grantById.get(extensionId);
    if (!existing) {
      throw new Error(`Unknown sandbox grant: ${extensionId}`);
    }
    const grant = freezeGrant({ ...existing, source });
    this.grantById.set(grant.id, grant);
    this.stop(extensionId);
    await this.start(grant);
  }

  getGrant(extensionId: string): SandboxExtensionGrant | undefined {
    return this.grantById.get(extensionId);
  }

  /**
   * Ask the widget isolate to expand its face for the given values.
   * Returns the element tree JSON (RenderNode) or null.
   *
   * **Ownership:** document state stays on the host (`data.values`). The isolate
   * only expands Preact → RenderNode; the host maps that to scene layers.
   * Handlers are stored per `layerId` so multi-instance widgets do not cross-wire.
   */
  async renderWidgetFace(
    extensionId: string,
    layerId: string,
    values: Record<string, unknown>,
    componentId?: string
  ): Promise<unknown> {
    const grant = this.grantById.get(extensionId);
    if (!(grant && hasCapability(grant, 'widget:render'))) {
      return null;
    }
    const isolate = this.isolates.get(extensionId);
    if (!isolate) {
      return null;
    }
    const lookupId = componentId ?? extensionId;
    return this.withWidgetLayerContext(layerId, async () =>
      isolate.evalModule(
        `(function () {
          var widget = globalThis.openenvx && globalThis.openenvx.widget;
          if (!widget || !widget._registry) return null;
          var entry = widget._registry[${JSON.stringify(lookupId)}]
            || widget._registry[${JSON.stringify(extensionId)}];
          if (!entry || typeof entry.render !== 'function') return null;
          var values = ${JSON.stringify(values)};
          widget._renderValues = values;
          widget.rendering = true;
          widget.applyProps = function (patch) {
            Object.assign(values, patch || {});
            return globalThis.openenvx.setSyncedState(values);
          };
          // Cleared by the engine after pending jobs so microtasks cannot escape the gate.
          widget._endRenderPass = function () {
            widget.rendering = false;
            widget.applyProps = null;
            widget._renderValues = null;
            widget._endRenderPass = null;
          };
          var result = entry.render(values);
          if (!result || typeof result !== 'object' || !('tree' in result)) {
            throw new Error('openenvx.widget render must return { tree, handlers }');
          }
          var bag =
            result.handlers && typeof result.handlers === 'object'
              ? result.handlers
              : {};
          widget._handlersByLayer = widget._handlersByLayer || Object.create(null);
          widget._handlersByLayer[${JSON.stringify(layerId)}] = bag;
          return result.tree;
        })()`
      )
    );
  }

  stop(extensionId: string, layerId?: string): void {
    const key = isolateKey(extensionId, layerId);
    const isolate = this.isolates.get(key);
    isolate?.dispose();
    this.isolates.delete(key);
    if (
      this.uiState?.extensionId === extensionId &&
      (layerId === undefined || this.uiState.layerId === layerId)
    ) {
      this.setUi(null);
    }
  }

  /**
   * Stop widget isolates whose extension ids are not in `desired`.
   */
  reconcileWidgetIsolates(
    desired: readonly { extensionId: string; layerId: string }[]
  ): void {
    const desiredIds = new Set(desired.map((entry) => entry.extensionId));
    const stale: string[] = [];
    for (const [id, grant] of this.grantById) {
      if (grant.kind !== 'widget') {
        continue;
      }
      if (!desiredIds.has(id) && this.isolates.has(id)) {
        stale.push(id);
      }
    }
    for (const key of stale) {
      this.isolates.get(key)?.dispose();
      this.isolates.delete(key);
      if (this.uiState?.extensionId === key) {
        this.setUi(null);
      }
    }
  }

  /**
   * Invoke a handler id inside the extension isolate for a widget layer.
   * Installs applyProps for the full handler lifetime (including async).
   * Handler pass is not a face-render pass — executeCommand / showUI allowed.
   */
  invokeWidgetHandler(
    extensionId: string,
    layerId: string,
    handlerId: string,
    payload?: unknown
  ): void {
    if (this.disposed) {
      return;
    }
    const isolate = this.isolates.get(extensionId);
    if (!isolate) {
      return;
    }
    void this.withWidgetLayerContext(layerId, async () => {
      try {
        await isolate.evalModule(
          `(async function () {
            var widget = globalThis.openenvx && globalThis.openenvx.widget;
            var current = await globalThis.openenvx.getSyncedState();
            var values =
              current && typeof current === 'object' && !Array.isArray(current)
                ? Object.assign({}, current)
                : {};
            if (widget) {
              widget._renderValues = values;
              widget.rendering = false;
              widget.applyProps = function (patch) {
                Object.assign(values, patch || {});
                return globalThis.openenvx.setSyncedState(values);
              };
            }
            try {
              var bags = (widget && widget._handlersByLayer) || {};
              var bag = bags[${JSON.stringify(layerId)}] || {};
              var fn = bag[${JSON.stringify(handlerId)}];
              if (typeof fn === 'function') {
                await fn(${JSON.stringify(payload ?? null)});
              }
            } finally {
              if (widget) {
                widget.applyProps = null;
                widget._renderValues = null;
              }
            }
          })()`
        );
      } catch (error) {
        console.error(
          '[sandbox] widget handler failed',
          extensionId,
          handlerId,
          error
        );
      }
    });
  }

  dispose(): void {
    this.disposed = true;
    for (const isolate of this.isolates.values()) {
      isolate.dispose();
    }
    this.isolates.clear();
    this.starting.clear();
    this.setUi(null);
  }

  private setUi(state: SandboxUiState | null): void {
    this.uiState = state;
    for (const listener of this.uiListeners) {
      listener(state);
    }
  }

  private ownsOpenUi(grantId: string, layerId?: string): boolean {
    if (!this.uiState || this.uiState.extensionId !== grantId) {
      return false;
    }
    if (layerId !== undefined && this.uiState.layerId !== layerId) {
      return false;
    }
    return true;
  }

  private emitUiOutbound(pluginMessage: unknown): void {
    assertUiMessagePolicy(pluginMessage);
    for (const listener of this.uiOutboundListeners) {
      listener(pluginMessage);
    }
  }

  private emitNotify(extensionId: string, message: string): void {
    this.assertNotifyAllowed(extensionId, message);
    this.notifySeq += 1;
    const event: SandboxNotifyEvent = {
      id: `${extensionId}:${this.notifySeq}`,
      extensionId,
      message,
    };
    for (const listener of this.notifyListeners) {
      listener(event);
    }
  }

  private assertNotifyAllowed(extensionId: string, message: string): void {
    const updated = assertNotifyPolicy({
      message,
      recentTimestamps: this.notifyTimestamps.get(extensionId) ?? [],
    });
    this.notifyTimestamps.set(extensionId, updated);
  }

  /**
   * Run `fn` with `activeWidgetLayerId` set, serialized against other widget ops
   * on this controller (shared isolate must not interleave instance contexts).
   */
  private withWidgetLayerContext<T>(
    layerId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const run = async (): Promise<T> => {
      this.activeWidgetLayerId = layerId;
      try {
        return await fn();
      } finally {
        if (this.activeWidgetLayerId === layerId) {
          this.activeWidgetLayerId = null;
        }
      }
    };
    const next = this.widgetOpTail.then(run, run);
    this.widgetOpTail = next.then(
      () => {},
      () => {}
    );
    return next;
  }

  private createHandlers(
    grant: SandboxExtensionGrant,
    layerId?: string
  ): SandboxHostHandlers {
    const host = this.options.host;
    /** UI ownership: prefer active render/invoke context, else start() layerId. */
    const uiLayerId = (): string | undefined =>
      this.activeWidgetLayerId ?? layerId;
    return {
      getSelection: () => {
        const selection = host.getSelection();
        return {
          activePageId: selection.activePageId,
          selectedLayerIds: selection.selectedLayerIds,
          primaryLayerId: selection.primaryLayerId,
        };
      },
      getPageId: () => host.getSelection().activePageId,
      executeCommand: async (commandId, args) =>
        host.executeCommand(commandId, args),
      showUI: (html, options) => {
        const resolved = html || grant.uiHtml || '<p>Extension</p>';
        if (resolved.length > MAX_SHOW_UI_HTML_CHARS) {
          throw new Error('showUI HTML too large');
        }
        this.setUi({
          extensionId: grant.id,
          html: resolved,
          width: options?.width ?? 320,
          height: options?.height ?? 240,
          kind: grant.kind,
          layerId: uiLayerId(),
        });
      },
      resizeUI: (width, height) => {
        if (!this.ownsOpenUi(grant.id, uiLayerId())) {
          return;
        }
        this.setUi({ ...this.uiState!, width, height });
      },
      closeUI: () => {
        if (this.ownsOpenUi(grant.id, uiLayerId())) {
          this.setUi(null);
        }
      },
      postToUI: (pluginMessage) => {
        if (!this.ownsOpenUi(grant.id, uiLayerId())) {
          throw new Error('No open UI for this extension');
        }
        this.emitUiOutbound(pluginMessage);
      },
      notify: (message) => {
        this.emitNotify(grant.id, message);
      },
      closePlugin: () => {
        this.stop(grant.id, layerId);
      },
      getClientStorage: (key) =>
        this.clientStorage.get(`${grant.id}:${key}`) ?? null,
      setClientStorage: (key, value) => {
        const storageKey = `${grant.id}:${key}`;
        if (
          !this.clientStorage.has(storageKey) &&
          this.clientStorage.size >= MAX_CLIENT_STORAGE_KEYS
        ) {
          throw new Error('clientStorage key limit exceeded');
        }
        const encoded = JSON.stringify(value ?? null);
        if (encoded.length > MAX_CLIENT_STORAGE_VALUE_CHARS) {
          throw new Error('clientStorage value too large');
        }
        this.clientStorage.set(storageKey, value);
      },
      getSyncedState: () => {
        const id = this.activeWidgetLayerId;
        if (!id) {
          return null;
        }
        return this.options.getWidgetValues?.(id) ?? null;
      },
      setSyncedState: (value) => {
        const id = this.activeWidgetLayerId;
        if (!id) {
          throw new Error(
            'Widget values require an active widget layer context'
          );
        }
        const encoded = JSON.stringify(value ?? null);
        if (encoded.length > MAX_WIDGET_VALUES_JSON_CHARS) {
          throw new Error('Widget values too large');
        }
        this.options.setWidgetValues?.(id, value);
      },
      resizeWidget: (width, height) => {
        const id = this.activeWidgetLayerId;
        if (!id) {
          throw new Error(
            'resizeWidget requires an active widget layer context'
          );
        }
        this.options.resizeWidgetLayer?.(id, width, height);
      },
    };
  }
}
