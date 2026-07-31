import {
  Command,
  findLayerById,
  updateLayerInTree,
  walkLayers,
} from '@openenvx/core';
import {
  WorkbenchPlugin,
  type WorkbenchPluginContext,
} from '@openenvx/headless';
import type { SandboxExtensionGrant } from '@xmazu/openenvxee-plugin-protocol';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { SandboxExtensionController } from './sandbox-extension-controller';
import { SandboxUiModal } from './sandbox-ui-modal';

const DEFAULT_WIDGET_LAYER_TYPE = 'openenvx.widget';

export interface SandboxExtensionPluginOptions {
  grants: SandboxExtensionGrant[];
  permission?: 'read' | 'edit';
  /**
   * When true, start plugin-kind grants on activate.
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
 * Host plugin: loads session-granted QuickJS bundles in a Worker, mounts plugin
 * showUI as a floating modal iframe (Figma-shaped), and binds widget isolates to
 * widget canvas layers (on-canvas object — no default iframe; one isolate per layer).
 */
export class SandboxExtensionPlugin extends WorkbenchPlugin {
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
  private controller: SandboxExtensionController | null = null;
  private widgetWatchDispose: (() => void) | null = null;
  private selectionWatchDispose: (() => void) | null = null;
  private widgetClickDispose: (() => void) | null = null;
  private modalHost: HTMLDivElement | null = null;
  private modalRoot: Root | null = null;

  constructor(options: SandboxExtensionPluginOptions) {
    super();
    this.grants = options.grants;
    this.permission = options.permission ?? 'read';
    this.autoStartPlugins = options.autoStartPlugins ?? false;
    this.workerUrl = options.workerUrl;
    this.preferInProcess = options.preferInProcess;
    this.widgetLayerType = options.widgetLayerType ?? DEFAULT_WIDGET_LAYER_TYPE;
    this.bindWidgetClick = options.bindWidgetClick;
  }

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    if (this.grants.length === 0) {
      return;
    }

    const widgetLayerType = this.widgetLayerType;
    const controller = new SandboxExtensionController({
      grants: this.grants,
      permission: this.permission,
      ctx,
      workerUrl: this.workerUrl,
      preferInProcess: this.preferInProcess,
      getWidgetSyncedState: (layerId) => {
        const layer = findLayerById(ctx.scene.getScene(), layerId);
        if (!layer || layer.type !== widgetLayerType) {
          return null;
        }
        const data = layer.data as { syncedState?: unknown };
        return data.syncedState ?? null;
      },
      setWidgetSyncedState: (layerId, value) => {
        const layer = findLayerById(ctx.scene.getScene(), layerId);
        if (!layer || layer.type !== widgetLayerType) {
          return;
        }
        ctx.scene.apply({
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
        const layer = findLayerById(ctx.scene.getScene(), layerId);
        if (!layer) {
          return;
        }
        ctx.scene.apply({
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

    // Modal host (not a sidebar panel) — Figma plugin UI is a floating dialog.
    const host = document.createElement('div');
    host.dataset.openenvxSandboxUi = '1';
    document.body.append(host);
    this.modalHost = host;
    this.modalRoot = createRoot(host);
    this.modalRoot.render(createElement(SandboxUiModal, { controller }));

    for (const grant of this.grants) {
      if (grant.kind !== 'plugin') {
        continue;
      }
      const extensionId = grant.id;
      ctx.register(
        new (class extends Command {
          readonly id = `openenvx.sandbox.run.${extensionId}`;
          readonly title = grant.title?.trim() || `Run ${extensionId}`;
          async execute(): Promise<{ started: boolean }> {
            await controller.start(grant);
            return { started: true };
          }
        })()
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
      const scene = ctx.scene.getScene();
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
    this.widgetWatchDispose = ctx.scene.onDidChangeScene(() => {
      syncWidgets();
    });
    this.selectionWatchDispose = ctx.events.onDidChangeSelection(() => {
      controller.notifyUiContextChanged();
    }).dispose;
    if (this.bindWidgetClick) {
      this.widgetClickDispose = this.bindWidgetClick((layerId) => {
        controller.dispatchWidgetClick(layerId);
      });
    }
  }

  override deactivate(): void {
    this.widgetWatchDispose?.();
    this.widgetWatchDispose = null;
    this.selectionWatchDispose?.();
    this.selectionWatchDispose = null;
    this.widgetClickDispose?.();
    this.widgetClickDispose = null;
    this.controller?.dispose();
    this.controller = null;
    this.modalRoot?.unmount();
    this.modalRoot = null;
    this.modalHost?.remove();
    this.modalHost = null;
  }
}
