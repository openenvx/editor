import type { SandboxHostSurface } from '@openenvx/headless';
import type {
  SandboxExtensionGrant,
  SandboxBridgeRequest,
  SandboxUiSelection,
} from '@xmazu/openenvxee-plugin-protocol';

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
  return layerId ? `${extensionId}:${layerId}` : extensionId;
}

function layerIdFromIsolateKey(key: string): string | null {
  const colon = key.indexOf(':');
  return colon === -1 ? null : key.slice(colon + 1);
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

  constructor(
    private readonly options: {
      grants: SandboxExtensionGrant[];
      permission: 'read' | 'edit';
      host: SandboxHostSurface;
      fetchImpl?: typeof fetch;
      workerUrl?: string | URL;
      /** Test-only: allow in-process QuickJS (never for production hosts). */
      preferInProcess?: boolean;
      /** Optional: resolve widget layer synced state by layer id. */
      getWidgetSyncedState?: (layerId: string) => unknown;
      setWidgetSyncedState?: (layerId: string, value: unknown) => void;
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
      const source = await fetchAndVerifyArtifact({
        url: frozen.artifactUrl,
        contentHash: frozen.contentHash,
        fetchImpl: this.options.fetchImpl,
      });
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
   * Stop widget isolates whose keys are not in `desired` (`extensionId:layerId`).
   * Plugin isolates (no `:`) are left alone.
   */
  reconcileWidgetIsolates(
    desired: readonly { extensionId: string; layerId: string }[]
  ): void {
    const desiredKeys = new Set(
      desired.map((entry) => isolateKey(entry.extensionId, entry.layerId))
    );
    const stale: string[] = [];
    for (const key of this.isolates.keys()) {
      if (layerIdFromIsolateKey(key) !== null && !desiredKeys.has(key)) {
        stale.push(key);
      }
    }
    for (const key of stale) {
      this.isolates.get(key)?.dispose();
      this.isolates.delete(key);
      const layerId = layerIdFromIsolateKey(key);
      if (
        this.uiState?.layerId &&
        layerId &&
        this.uiState.layerId === layerId
      ) {
        this.setUi(null);
      }
    }
  }

  /** Figma-shaped: wake widget isolate on canvas node click. */
  dispatchWidgetClick(layerId: string): void {
    if (this.disposed) {
      return;
    }
    for (const [key, isolate] of this.isolates) {
      if (layerIdFromIsolateKey(key) !== layerId) {
        continue;
      }
      void isolate
        .evalModule(
          `void Promise.resolve(
            typeof globalThis.__openenvxOnClick === 'function'
              ? globalThis.__openenvxOnClick()
              : undefined
          );`
        )
        .catch((error) => {
          console.error('[sandbox] widget click failed', layerId, error);
        });
      return;
    }
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

  private createHandlers(
    grant: SandboxExtensionGrant,
    layerId?: string
  ): SandboxHostHandlers {
    const host = this.options.host;
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
          layerId,
        });
      },
      resizeUI: (width, height) => {
        if (!this.ownsOpenUi(grant.id, layerId)) {
          return;
        }
        this.setUi({ ...this.uiState!, width, height });
      },
      closeUI: () => {
        if (this.ownsOpenUi(grant.id, layerId)) {
          this.setUi(null);
        }
      },
      postToUI: (pluginMessage) => {
        if (!this.ownsOpenUi(grant.id, layerId)) {
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
        if (!layerId) {
          return null;
        }
        return this.options.getWidgetSyncedState?.(layerId) ?? null;
      },
      setSyncedState: (value) => {
        if (!layerId) {
          throw new Error('Synced state requires a widget layer');
        }
        this.options.setWidgetSyncedState?.(layerId, value);
      },
      resizeWidget: (width, height) => {
        if (!layerId) {
          throw new Error('resizeWidget requires a widget layer');
        }
        this.options.resizeWidgetLayer?.(layerId, width, height);
      },
    };
  }
}
