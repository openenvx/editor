import {
  Command,
  findLayerById,
  updateLayerInTree,
  walkLayers,
} from '@openenvx/core';
import type { SandboxHostSurface, WorkbenchApi } from '@openenvx/headless';
import {
  createExtensionContributions,
  extensionSurfaceStore,
} from '@openenvx/headless';
import type {
  ExtensionManifest,
  RenderNode,
  SandboxExtensionGrant,
} from '@xmazu/openenvxee-protocol';
import { validatePluginTree } from '@xmazu/openenvxee-protocol';
import type { Layer, Scene } from '@xmazu/openenvxee-schema';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { registerWidgetInsertCommands } from './register-widget-insert-commands';
import { SandboxExtensionController } from './sandbox-extension-controller';
import { SandboxUiPanel } from './sandbox-ui-panel';
import { createWidgetSceneAdapters } from './widget-scene-adapters';

const DEFAULT_WIDGET_LAYER_TYPE = 'openenvx.widget';

/** Resolve face medium from manifest kinds — single-kind only; ambiguous → canvas. */
function resolveWidgetFaceKind(
  kinds: ('canvas' | 'html')[] | undefined
): 'canvas' | 'html' {
  if (kinds?.length === 1 && kinds[0] === 'html') {
    return 'html';
  }
  return 'canvas';
}

/** Host-injected face applicator (studio / html-studio). */
export type ApplyWidgetFaceFn = (
  widgetLayer: Layer,
  tree: RenderNode,
  kind?: 'canvas' | 'html'
) => Layer;

function findWidgetClickInLayers(
  layers: Scene['pages'][number]['layers'],
  targetLayerId: string,
  widgetLayerType: string
): {
  widgetId: string;
  extensionId: string;
  handlerId: string;
} | null {
  let result: {
    widgetId: string;
    extensionId: string;
    handlerId: string;
  } | null = null;

  walkLayers(layers, (layer, path) => {
    if (result || layer.id !== targetLayerId) {
      return;
    }
    const ancestors = [...path, layer];
    for (let i = ancestors.length - 1; i >= 0; i -= 1) {
      const candidate = ancestors[i];
      if (candidate?.type !== widgetLayerType) {
        continue;
      }
      const data = candidate.data as {
        extensionId?: string;
        handlers?: Record<string, Record<string, string>>;
      };
      const extensionId = data.extensionId ?? null;
      const handlerId =
        data.handlers?.[targetLayerId]?.click ??
        data.handlers?.[candidate.id]?.click ??
        null;
      if (extensionId && handlerId) {
        result = { widgetId: candidate.id, extensionId, handlerId };
      }
      break;
    }
  });

  return result;
}

function resolveWidgetClickTarget(
  scene: Scene,
  targetLayerId: string,
  widgetLayerType: string
): {
  widgetId: string;
  extensionId: string;
  handlerId: string;
} | null {
  for (const page of scene.pages) {
    const found = findWidgetClickInLayers(
      page.layers,
      targetLayerId,
      widgetLayerType
    );
    if (found) {
      return found;
    }
  }
  return null;
}

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
  /**
   * Apply a rendered element tree onto a widget layer (children, handlers, size).
   * Studio injects canvas / html applicators so workbench stays engine-free.
   */
  applyWidgetFace?: ApplyWidgetFaceFn;
  /** Static extension manifests activated on mount (chrome, views, commands). */
  manifests?: ExtensionManifest[];
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
  private readonly applyWidgetFace?: ApplyWidgetFaceFn;
  private readonly manifests: ExtensionManifest[];
  private mounted = false;
  private controller: SandboxExtensionController | null = null;
  private readonly surfaceDisposables: { dispose(): void }[] = [];
  private widgetWatchDispose: (() => void) | null = null;
  private selectionWatchDispose: (() => void) | null = null;
  private widgetClickDispose: (() => void) | null = null;
  private readonly lastWidgetValues = new Map<string, string>();
  private readonly faceEpoch = new Map<string, number>();
  private uiHost: HTMLDivElement | null = null;
  private uiRoot: Root | null = null;

  constructor(options: SandboxExtensionHostOptions) {
    this.grants = options.grants;
    this.permission = options.permission ?? 'read';
    this.autoStartPlugins = options.autoStartPlugins ?? false;
    this.workerUrl = options.workerUrl;
    this.preferInProcess = options.preferInProcess;
    this.widgetLayerType = options.widgetLayerType ?? DEFAULT_WIDGET_LAYER_TYPE;
    this.bindWidgetClick = options.bindWidgetClick;
    this.applyWidgetFace = options.applyWidgetFace;
    this.manifests = options.manifests ?? [];
  }

  /** Apply a `render` body to a manifest-declared view / panel surface. */
  applySurfaceRender(surfaceId: string, root: RenderNode | null): void {
    if (root === null) {
      extensionSurfaceStore.set(surfaceId, null);
      return;
    }
    const validated = validatePluginTree(root);
    if (!validated.ok) {
      console.error(
        '[sandbox] applySurfaceRender rejected tree',
        surfaceId,
        validated.reason
      );
      return;
    }
    extensionSurfaceStore.set(surfaceId, validated.root);
  }

  /** Push widget source from the parent page (integrator bundle). */
  async pushWidgetSource(extensionId: string, source: string): Promise<void> {
    if (!this.controller) {
      throw new Error('SandboxExtensionHost is not mounted');
    }
    await this.controller.pushWidgetSource(extensionId, source);
  }

  getController(): SandboxExtensionController | null {
    return this.controller;
  }

  /** Attach to a narrow host surface. Call once per mount. */
  mount(host: SandboxHostSurface): void {
    if (this.mounted) {
      throw new Error('SandboxExtensionHost already mounted');
    }
    this.mounted = true;

    const widgetLayerType = this.widgetLayerType;
    const applyFace = this.applyWidgetFace;
    const lastValues = this.lastWidgetValues;
    const faceEpoch = this.faceEpoch;
    const sceneAdapters = createWidgetSceneAdapters({
      host,
      widgetLayerType,
    });
    const controller = new SandboxExtensionController({
      grants: this.grants,
      permission: this.permission,
      host,
      workerUrl: this.workerUrl,
      preferInProcess: this.preferInProcess,
      ...sceneAdapters,
    });
    this.controller = controller;

    const refreshFace = async (layerId: string): Promise<void> => {
      if (!applyFace) {
        return;
      }
      const epoch = (faceEpoch.get(layerId) ?? 0) + 1;
      faceEpoch.set(layerId, epoch);
      const layer = findLayerById(host.getScene(), layerId);
      if (!layer || layer.type !== widgetLayerType) {
        return;
      }
      const data = layer.data as {
        extensionId?: string;
        values?: Record<string, unknown>;
        manifest?: { id?: string; kinds?: ('canvas' | 'html')[] };
      };
      if (!data.extensionId) {
        return;
      }
      const tree = await controller.renderWidgetFace(
        data.extensionId,
        layerId,
        data.values ?? {},
        data.manifest?.id
      );
      if (faceEpoch.get(layerId) !== epoch) {
        return;
      }
      if (!tree || typeof tree !== 'object' || !('type' in tree)) {
        return;
      }
      const kind = resolveWidgetFaceKind(data.manifest?.kinds);
      const next = applyFace(layer, tree as RenderNode, kind);
      if (faceEpoch.get(layerId) !== epoch) {
        return;
      }
      host.apply({
        label: 'Render widget face',
        apply: (scene) => ({
          ...scene,
          pages: scene.pages.map((page) => ({
            ...page,
            layers: updateLayerInTree(page.layers, layerId, (current) => ({
              ...current,
              ...(next.transform ? { transform: next.transform } : {}),
              data: {
                ...(current.data as Record<string, unknown>),
                ...(next.data as Record<string, unknown>),
              },
            })),
          })),
        }),
      });
      const applied = findLayerById(host.getScene(), layerId);
      if (applied) {
        lastValues.set(
          layerId,
          JSON.stringify((applied.data as { values?: unknown }).values ?? {})
        );
      }
    };

    const uiHost = document.createElement('div');
    uiHost.dataset.openenvxSandboxUi = '1';
    document.body.append(uiHost);
    this.uiHost = uiHost;
    this.uiRoot = createRoot(uiHost);
    this.uiRoot.render(createElement(SandboxUiPanel, { controller }));

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

    for (const manifestInput of this.manifests) {
      const grant = this.grants.find((entry) => entry.id === manifestInput.id);
      if (!grant) {
        console.error(
          '[sandbox] no grant for extension manifest',
          manifestInput.id
        );
        continue;
      }
      const result = createExtensionContributions(manifestInput, {
        grant: {
          capabilities: grant.capabilities,
          allowedCommands: grant.allowedCommands,
        },
      });
      if (!result.ok) {
        console.error('[sandbox] invalid extension manifest', result.reason);
        continue;
      }
      if (result.contributions.length > 0) {
        this.surfaceDisposables.push(
          host.registerWorkbenchContributions(...result.contributions)
        );
      }
      this.surfaceDisposables.push(
        ...registerWidgetInsertCommands(host, result.manifest, widgetLayerType)
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
      const desired: { extensionId: string; layerId: string }[] = [];
      const seenLayerIds = new Set<string>();
      for (const page of scene.pages) {
        walkLayers(page.layers, (layer) => {
          if (layer.type !== widgetLayerType) {
            return;
          }
          const data = layer.data as { extensionId?: string };
          if (!data.extensionId) {
            return;
          }
          const grant =
            controller.getGrant(data.extensionId) ??
            this.grants.find((entry) => entry.id === data.extensionId);
          if (!grant || grant.kind !== 'widget') {
            return;
          }
          desired.push({ extensionId: grant.id, layerId: layer.id });
          seenLayerIds.add(layer.id);
          const valuesKey = JSON.stringify(
            (layer.data as { values?: unknown }).values ?? {}
          );
          const shouldRefresh = lastValues.get(layer.id) !== valuesKey;
          void controller
            .start(grant, layer.id)
            .then(() => {
              if (shouldRefresh) {
                return refreshFace(layer.id);
              }
            })
            .catch((error) => {
              console.error(
                '[sandbox] failed to start widget',
                grant.id,
                error
              );
            });
        });
      }
      for (const layerId of lastValues.keys()) {
        if (!seenLayerIds.has(layerId)) {
          lastValues.delete(layerId);
          faceEpoch.delete(layerId);
        }
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
      this.widgetClickDispose = this.bindWidgetClick((targetLayerId) => {
        const resolved = resolveWidgetClickTarget(
          host.getScene(),
          targetLayerId,
          widgetLayerType
        );
        if (!resolved) {
          return;
        }
        controller.invokeWidgetHandler(
          resolved.extensionId,
          resolved.widgetId,
          resolved.handlerId,
          {
            targetLayerId,
          }
        );
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
    this.uiRoot?.unmount();
    this.uiRoot = null;
    this.uiHost?.remove();
    this.uiHost = null;
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
