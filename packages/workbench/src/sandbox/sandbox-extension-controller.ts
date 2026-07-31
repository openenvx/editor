import type { PluginContext } from '@openenvx/core';
import type {
  SandboxExtensionGrant,
  SandboxBridgeRequest,
} from '@xmazu/openenvxee-plugin-protocol';

import { fetchAndVerifyArtifact } from './fetch-artifact';
import {
  createSandboxHostBridge,
  type SandboxHostHandlers,
} from './host-bridge';
import { createQuickJsIsolate, type SandboxIsolate } from './quickjs-runtime';

export interface SandboxUiState {
  extensionId: string;
  html: string;
  width: number;
  height: number;
  kind: 'plugin' | 'widget';
  layerId?: string;
}

export type SandboxUiListener = (state: SandboxUiState | null) => void;

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
  private readonly clientStorage = new Map<string, unknown>();
  private uiState: SandboxUiState | null = null;
  private readonly uiListeners = new Set<SandboxUiListener>();
  private disposed = false;

  constructor(
    private readonly options: {
      grants: SandboxExtensionGrant[];
      permission: 'read' | 'edit';
      ctx: PluginContext;
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
  ) {}

  subscribeUi(listener: SandboxUiListener): () => void {
    this.uiListeners.add(listener);
    listener(this.uiState);
    return () => this.uiListeners.delete(listener);
  }

  getUiState(): SandboxUiState | null {
    return this.uiState;
  }

  /** Close the modal iframe only — does not stop the isolate. */
  closeUi(extensionId?: string): void {
    if (
      this.uiState &&
      (extensionId === undefined || this.uiState.extensionId === extensionId)
    ) {
      this.setUi(null);
    }
  }

  async startAll(): Promise<void> {
    for (const grant of this.options.grants) {
      await this.start(grant);
    }
  }

  async start(grant: SandboxExtensionGrant, layerId?: string): Promise<void> {
    if (this.disposed) {
      return;
    }
    const key = isolateKey(grant.id, layerId);
    if (this.isolates.has(key)) {
      return;
    }

    const source = await fetchAndVerifyArtifact({
      url: grant.artifactUrl,
      contentHash: grant.contentHash,
      fetchImpl: this.options.fetchImpl,
    });
    if (this.disposed) {
      return;
    }

    const handlers = this.createHandlers(grant, layerId);
    const bridge = createSandboxHostBridge({
      grant,
      permission: this.options.permission,
      handlers,
    });

    const isolate = await createQuickJsIsolate({
      onHostCall: (request: SandboxBridgeRequest) => bridge.handle(request),
      workerUrl: this.options.workerUrl,
      preferInProcess: this.options.preferInProcess,
    });
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
  }

  stop(extensionId: string, layerId?: string): void {
    const key = isolateKey(extensionId, layerId);
    const isolate = this.isolates.get(key);
    isolate?.dispose();
    this.isolates.delete(key);
    if (this.uiState?.extensionId === extensionId) {
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
    this.setUi(null);
  }

  private setUi(state: SandboxUiState | null): void {
    this.uiState = state;
    for (const listener of this.uiListeners) {
      listener(state);
    }
  }

  private createHandlers(
    grant: SandboxExtensionGrant,
    layerId?: string
  ): SandboxHostHandlers {
    const ctx = this.options.ctx;
    return {
      getSelection: () => {
        const selection = ctx.scene.getSelection();
        return {
          activePageId: selection.activePageId,
          selectedLayerIds: selection.selectedLayerIds,
          primaryLayerId: selection.primaryLayerId,
        };
      },
      getPageId: () => ctx.scene.getSelection().activePageId,
      executeCommand: async (commandId, args) => {
        const result = await ctx.commands.execute(
          commandId,
          {
            scene: ctx.scene,
            selection: ctx.scene.getSelection(),
            services: ctx.services,
            events: ctx.events,
            editor: ctx.editor,
          },
          ctx.events,
          args
        );
        return { executed: result.executed };
      },
      showUI: (html, options) => {
        this.setUi({
          extensionId: grant.id,
          html: html || grant.uiHtml || '<p>Plugin</p>',
          width: options?.width ?? 320,
          height: options?.height ?? 240,
          kind: grant.kind,
          layerId,
        });
      },
      resizeUI: (width, height) => {
        if (!this.uiState || this.uiState.extensionId !== grant.id) {
          return;
        }
        this.setUi({ ...this.uiState, width, height });
      },
      closeUI: () => {
        if (this.uiState?.extensionId === grant.id) {
          this.setUi(null);
        }
      },
      notify: (_message) => {
        // Host toast reserved; capability + serialization already gated.
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
