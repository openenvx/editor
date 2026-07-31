import {
  Command,
  findLayerById,
  updateLayerInTree,
  walkLayers,
} from '@openenvx/core';
import type { SandboxHostSurface, WorkbenchApi } from '@openenvx/headless';
import type { SandboxExtensionGrant } from '@xmazu/openenvxee-plugin-protocol';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { SandboxExtensionController } from './sandbox-extension-controller';
import { SandboxUiModal } from './sandbox-ui-modal';

const DEFAULT_WIDGET_LAYER_TYPE = 'openenvx.widget';

export interface SandboxExtensionHostOptions {
  grants: SandboxExtensionGrant[];
  permission?: 'read' | 'edit';
  /**
   * When true, start plugin-kind grants on mount.
   * Production default is false (Figma-shaped: user runs via command).
   * Widgets always start when matching layers appear.
   */
  autoStartPlugins?: boolean;
  /** Absolute Worker URL. Required for non-source hosts that do not co-locate the worker. */
  workerUrl?: string | URL;
  /**
   * Test-only. Allows in-process QuickJS. Production hosts must omit this —
   * extension JS runs in a dedicated Worker only.
   */
  preferInProcess?: boolean;
  /** Canvas widget layer type id. Defaults to `openenvx.widget`. */
  widgetLayerType?: string;
  /**
   * Bind canvas widget clicks to the sandbox controller.
   * Studio injects canvas `setOpenEnvxWidgetClickHandler` so workbench stays canvas-free.
   */
  bindWidgetClick?: (handler: (layerId: string) => void) => () => void;
}

/**
 * External sandbox host — not a WorkbenchPlugin / PluginManager citizen.
 * Mount via {@link mountSandboxExtensions} on a narrow {@link SandboxHostSurface}.
 */
export class SandboxExtensionHost {
  readonly id = 'openenvx.sandbox-extensions';

  private readonly grants: SandboxExtensionGrant[];
  private readonly permission: 'read' | 'edit';
  private readonly autoStartPlugins: boolean;
  private readonly workerUrl?: string | URL;
  private readonly preferInProcess: boolean | undefined;
  private readonly widgetLayerType: string;
  private readonly bindWidgetClick?: (
    handler: (layerId: string) => void
  ) => () => void;
  private mounted = false;
  private controller: SandboxExtensionController | null = null;
  private readonly surfaceDisposables: { dispose(): void }[] = [];
  private widgetWatchDispose: (() => void) | null = null;
  private selectionWatchDispose: (() => void) | null = null;
  private widgetClickDispose: (() => void) | null = null;
  private modalHost: HTMLDivElement | null = null;
  private modalRoot: Root | null = null;

  constructor(options: SandboxExtensionHostOptions) {
    this.grants = options.grants;
    this.permission = options.permission ?? 'read';
    this.autoStartPlugins = options.autoStartPlugins ?? false;
    this.workerUrl = options.workerUrl;
    this.preferInProcess = options.preferInProcess;
    this.widgetLayerType = options.widgetLayerType ?? DEFAULT_WIDGET_LAYER_TYPE;
    this.bindWidgetClick = options.bindWidgetClick;
  }

  /** Attach to a narrow host surface. Call once per mount. */
  mount(host: SandboxHostSurface): void {
    if (this.mounted) {
      throw new Error('SandboxExtensionHost already mounted');
    }
    this.mounted = true;

    if (this.grants.length === 0) {
      return;
    }

    const widgetLayerType = this.widgetLayerType;
    const controller = new SandboxExtensionController({
      grants: this.grants,
      permission: this.permission,
      host,
      workerUrl: this.workerUrl,
      preferInProcess: this.preferInProcess,
      getWidgetSyncedState: (layerId) => {
        const layer = findLayerById(host.getScene(), layerId);
        if (!layer || layer.type !== widgetLayerType) {
          return null;
        }
        const data = layer.data as { syncedState?: unknown };
        return data.syncedState ?? null;
      },
      setWidgetSyncedState: (layerId, value) => {
        const layer = findLayerById(host.getScene(), layerId);
        if (!layer || layer.type !== widgetLayerType) {
          return;
        }
        host.apply({
          label: 'Update widget synced state',
          apply: (scene) => ({
            ...scene,
            pages: scene.pages.map((page) => ({
              ...page,
              layers: updateLayerInTree(page.layers, layerId, (current) => ({
                ...current,
                data: {
                  ...(current.data as Record<string, unknown>),
                  syncedState: value,
                },
              })),
            })),
          }),
        });
      },
      resizeWidgetLayer: (layerId, width, height) => {
        const layer = findLayerById(host.getScene(), layerId);
        if (!layer) {
          return;
        }
        host.apply({
          label: 'Resize widget',
          apply: (scene) => ({
            ...scene,
            pages: scene.pages.map((page) => ({
              ...page,
              layers: updateLayerInTree(page.layers, layerId, (current) => ({
                ...current,
                transform: {
                  ...current.transform,
                  width,
                  height,
                },
              })),
            })),
          }),
        });
      },
    });
    this.controller = controller;

    const modalHost = document.createElement('div');
    modalHost.dataset.openenvxSandboxUi = '1';
    document.body.append(modalHost);
    this.modalHost = modalHost;
    this.modalRoot = createRoot(modalHost);
    this.modalRoot.render(createElement(SandboxUiModal, { controller }));

    for (const grant of this.grants) {
      if (grant.kind !== 'plugin') {
        continue;
      }
      const extensionId = grant.id;
      this.surfaceDisposables.push(
        host.registerCommand(
          new (class extends Command {
            readonly id = `openenvx.sandbox.run.${extensionId}`;
            readonly title = grant.title?.trim() || `Run ${extensionId}`;
            async execute(): Promise<{ started: boolean }> {
              await controller.start(grant);
              return { started: true };
            }
          })()
        )
      );
    }

    if (this.autoStartPlugins) {
      void (async () => {
        for (const grant of this.grants) {
          if (grant.kind === 'plugin') {
            try {
              await controller.start(grant);
            } catch (error) {
              console.error(
                '[sandbox] failed to start plugin',
                grant.id,
                error
              );
            }
          }
        }
      })();
    }

    const syncWidgets = () => {
      const scene = host.getScene();
      const widgetGrants = new Map(
        this.grants.filter((g) => g.kind === 'widget').map((g) => [g.id, g])
      );
      const desired: { extensionId: string; layerId: string }[] = [];
      for (const page of scene.pages) {
        walkLayers(page.layers, (layer) => {
          if (layer.type !== widgetLayerType) {
            return;
          }
          const data = layer.data as { extensionId?: string };
          const grant = data.extensionId
            ? widgetGrants.get(data.extensionId)
            : undefined;
          if (!grant) {
            return;
          }
          desired.push({ extensionId: grant.id, layerId: layer.id });
          void controller.start(grant, layer.id).catch((error) => {
            console.error('[sandbox] failed to start widget', grant.id, error);
          });
        });
      }
      controller.reconcileWidgetIsolates(desired);
    };

    syncWidgets();
    this.widgetWatchDispose = host.onDidChangeScene(() => {
      syncWidgets();
    });
    this.selectionWatchDispose = host.onDidChangeSelection(() => {
      controller.notifyUiContextChanged();
    });
    if (this.bindWidgetClick) {
      this.widgetClickDispose = this.bindWidgetClick((layerId) => {
        controller.dispatchWidgetClick(layerId);
      });
    }
  }

  dispose(): void {
    this.widgetWatchDispose?.();
    this.widgetWatchDispose = null;
    this.selectionWatchDispose?.();
    this.selectionWatchDispose = null;
    this.widgetClickDispose?.();
    this.widgetClickDispose = null;
    for (const disposable of this.surfaceDisposables.splice(0)) {
      disposable.dispose();
    }
    this.controller?.dispose();
    this.controller = null;
    this.modalRoot?.unmount();
    this.modalRoot = null;
    this.modalHost?.remove();
    this.modalHost = null;
    this.mounted = false;
  }
}

/** Mount a sandbox host via WorkbenchApi (not PluginManager). */
export function mountSandboxExtensions(
  api: Pick<WorkbenchApi, 'mountSandboxHost'>,
  host: SandboxExtensionHost
): () => void {
  return api.mountSandboxHost((surface) => {
    host.mount(surface);
    return () => host.dispose();
  });
}
