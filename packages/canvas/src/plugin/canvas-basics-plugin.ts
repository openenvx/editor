import {
  Command,
  getActivePage,
  InMemoryAssetService,
  isLayerEditable,
  isLayerLocked,
  isLayerWritable,
  localize,
  moveLayerRelativeToTarget,
  AssetServiceId,
  LayerRegistryServiceId,
  Plugin,
  SimpleServiceContribution,
  SingletonServiceContribution,
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
} from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  PluginContext,
  TreeItem,
} from '@openenvx/core';
import type { Page } from '@openenvx/schema';
import { getDefaultPageDimensions, normalizeScene } from '@openenvx/schema';

import {
  CanvasClipboardServiceId,
  CanvasCommandRequestServiceId,
  CanvasFontServiceId,
  CanvasPageResizeServiceId,
} from '../canvas-service-tokens';
import {
  CopyLayersCommand,
  CopyLayersShortcut,
  DeleteLayerShortcut,
  BackspaceDeleteLayerShortcut,
  DuplicateLayersCommand,
  DuplicateLayersShortcut,
  PasteExternalLayersCommand,
  PasteLayersCommand,
  PasteLayersShortcut,
} from '../clipboard/canvas-clipboard-contributions';
import { CanvasClipboardService } from '../clipboard/canvas-clipboard-service';
import {
  ExportImageCommand,
  ResizePagePresetCommand,
  SetPagePresetCommand,
  SetPageSizeCommand,
  UpdateLayerTransformCommand,
  UpdateRichTextTransformCommand,
  RotateLayerLeftCommand,
  RotateLayerRightCommand,
} from '../commands/canvas-api-commands';
import { CanvasCommandRequestService } from '../commands/canvas-command-request-service';
import {
  CanvasZoomInCommand,
  CanvasZoomOutCommand,
  CanvasZoomResetCommand,
  CanvasZoomTo100Command,
  CanvasZoomToFitCommand,
} from '../commands/canvas-zoom-commands';
import { AbsoluteEditorPaneContribution } from '../contributions/absolute-editor-pane-contribution';
import { CanvasCommandPaletteItems } from '../contributions/canvas-command-palette';
import { CanvasContextMenu } from '../contributions/canvas-context-menu';
import {
  CanvasStatusBarContribution,
  CanvasToolbarContribution,
} from '../contributions/canvas-shell-contributions';
import { canvasFontService } from '../fonts/canvas-font-service';
import { CanvasI18nBundle } from '../i18n/canvas-i18n-bundle';
import { CanvasCircleLayer } from '../layers/canvas-circle-layer';
import { CanvasImageLayer } from '../layers/canvas-image-layer';
import { CanvasRectLayer } from '../layers/canvas-rect-layer';
import { CanvasTextLayer } from '../layers/canvas-text-layer';
import { resizeSceneToPagePreset } from '../page-resize/apply-page-preset-resize';
import {
  builtinCanvasInteractionContributions,
  builtinCanvasRendererContributions,
  builtinLayerPreviewRendererContributions,
} from '../renderers/builtin-contributions';
import {
  ensureCanvasRegistriesInstalled,
  registerCanvasContribution,
} from './canvas-registry-service';

function createLayerId(type: string): string {
  return `${type}-${crypto.randomUUID()}`;
}

function insertCanvasLayer(ctx: CommandContext, layer: Layer): void {
  const page = getActivePage(ctx.scene.getScene());
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      pages: scene.pages.map((p) =>
        p.id === page.id ? { ...p, layers: [...p.layers, layer] } : p
      ),
      selection: {
        activePageId: page.id,
        selectedLayerIds: [layer.id],
        primaryLayerId: layer.id,
      },
    }),
    label: localize(ctx.services, 'canvas.history.insertLayer', {
      defaultValue: 'Insert layer',
    }),
  });
}

export class InsertCanvasTextCommand extends Command {
  readonly id = 'canvas.insertText';

  canExecute(ctx: CommandContext): boolean {
    return getActivePage(ctx.scene.getScene()).layout === 'absolute';
  }

  execute(ctx: CommandContext): void {
    const page = getActivePage(ctx.scene.getScene());
    const layer = new CanvasTextLayer().createDefault(
      createLayerId('text'),
      page
    );
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertCanvasImageCommand extends Command {
  readonly id = 'canvas.insertImage';

  canExecute(ctx: CommandContext): boolean {
    return getActivePage(ctx.scene.getScene()).layout === 'absolute';
  }

  execute(ctx: CommandContext): void {
    const page = getActivePage(ctx.scene.getScene());
    const layer = new CanvasImageLayer().createDefault(
      createLayerId('image'),
      page
    );
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertCanvasRectCommand extends Command {
  readonly id = 'canvas.insertRect';

  canExecute(ctx: CommandContext): boolean {
    return getActivePage(ctx.scene.getScene()).layout === 'absolute';
  }

  execute(ctx: CommandContext): void {
    const page = getActivePage(ctx.scene.getScene());
    const layer = new CanvasRectLayer().createDefault(
      createLayerId('rect'),
      page
    );
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertCanvasCircleCommand extends Command {
  readonly id = 'canvas.insertCircle';

  canExecute(ctx: CommandContext): boolean {
    return getActivePage(ctx.scene.getScene()).layout === 'absolute';
  }

  execute(ctx: CommandContext): void {
    const page = getActivePage(ctx.scene.getScene());
    const layer = new CanvasCircleLayer().createDefault(
      createLayerId('circle'),
      page
    );
    insertCanvasLayer(ctx, layer);
  }
}

export class UploadAssetCommand extends Command {
  readonly id = 'canvas.uploadAsset';
  private static readonly maxBytes = 10 * 1024 * 1024;

  canExecute(ctx: CommandContext): boolean {
    return getActivePage(ctx.scene.getScene()).layout === 'absolute';
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }
    const assets = ctx.services.get(AssetServiceId);
    if (!assets?.upload) {
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    await new Promise<void>((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve();
          return;
        }
        if (
          !file.type.startsWith('image/') ||
          file.size > UploadAssetCommand.maxBytes
        ) {
          resolve();
          return;
        }
        const assetRef = await assets.upload!(file);
        const page = getActivePage(ctx.scene.getScene());
        const layer = new CanvasImageLayer().createDefault(
          createLayerId('image'),
          page
        );
        layer.data = { alt: file.name, assetRef };
        insertCanvasLayer(ctx, layer);
        resolve();
      };
    });
  }
}

class CanvasPagesTreeProvider extends TreeDataProvider<Page> {
  getRootChildren(ctx: CommandContext): Page[] {
    return ctx.scene.getScene().pages;
  }

  getChildren(): Page[] {
    return [];
  }

  getTreeItem(page: Page, _ctx: CommandContext): TreeItem {
    return {
      icon: 'file',
      id: page.id,
      label: page.name?.trim() ? page.name : 'Page',
    };
  }

  onSelect(page: Page, ctx: CommandContext): void {
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        activePageId: page.id,
        selection: {
          activePageId: page.id,
          primaryLayerId: null,
          selectedLayerIds: [],
        },
      }),
      label: localize(ctx.services, 'canvas.history.selectPage', {
        defaultValue: 'Select page',
      }),
    });
  }
}

class CanvasLayersTreeProvider extends TreeDataProvider<Layer> {
  getRootChildren(ctx: CommandContext): Layer[] {
    return getActivePage(ctx.scene.getScene()).layers;
  }

  getChildren(_node: Layer): Layer[] {
    return [];
  }

  getTreeItem(node: Layer, ctx: CommandContext): TreeItem {
    const layers = ctx.services.has(LayerRegistryServiceId)
      ? ctx.services.get(LayerRegistryServiceId)
      : undefined;
    const definition = layers?.get(node.type);
    const configLocked = !isLayerEditable(node);
    const runtimeLocked = isLayerLocked(node);
    const tooltip = configLocked
      ? 'This layer cannot be edited from the editor'
      : runtimeLocked
        ? 'Unlock layer (Mod+L)'
        : 'Lock layer (Mod+L)';
    return {
      icon: definition?.treeIcon,
      id: node.id,
      label: definition?.treeLabel(node) ?? node.type.replace('canvas.', ''),
      locked: configLocked || runtimeLocked,
      lockedCommandId: configLocked ? undefined : 'scene.toggleLayerLock',
      tooltip,
    };
  }

  onSelect(node: Layer, ctx: CommandContext): void {
    if (!isLayerEditable(node)) {
      return;
    }
    ctx.scene.selectLayers([node.id], node.id);
  }

  canMove(
    source: Layer,
    target: Layer,
    _position: 'before' | 'after' | 'inside'
  ): boolean {
    return (
      source.id !== target.id &&
      isLayerWritable(source) &&
      isLayerWritable(target)
    );
  }

  handleMove(
    source: Layer,
    target: Layer,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    const page = getActivePage(ctx.scene.getScene());
    const effectivePosition = position === 'inside' ? 'after' : position;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === page.id
            ? {
                ...p,
                layers: moveLayerRelativeToTarget(
                  p.layers,
                  source.id,
                  target.id,
                  effectivePosition
                ),
              }
            : p
        ),
      }),
      label: localize(ctx.services, 'canvas.history.reorderLayer', {
        defaultValue: 'Reorder layer',
      }),
    });
  }
}

export class CanvasPagesView extends ViewContribution {
  readonly id = 'canvas.pages';
  readonly containerId = 'canvas.sidebar';
  readonly name = 'Pages';
  readonly viewOrder = 0;
  readonly viewSelection = 'page' as const;

  createProvider(): TreeDataProvider<Page> {
    return new CanvasPagesTreeProvider();
  }
}

export class CanvasLayersView extends ViewContribution {
  readonly id = 'canvas.layers';
  readonly containerId = 'canvas.sidebar';
  readonly name = 'Layers';
  readonly viewOrder = 10;

  createProvider(): TreeDataProvider<Layer> {
    return new CanvasLayersTreeProvider();
  }
}

export class CanvasSidebarContainer extends ViewContainerContribution {
  readonly id = 'canvas.sidebar';
  readonly title = 'Layers';
  readonly icon = 'layers';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 10;
}

export class CanvasBasicsPlugin extends Plugin {
  readonly id = 'OpenEnvx.canvas-basics';

  activate(ctx: PluginContext): void {
    ensureCanvasRegistriesInstalled(ctx);

    for (const contribution of [
      ...builtinCanvasRendererContributions,
      ...builtinLayerPreviewRendererContributions,
      ...builtinCanvasInteractionContributions,
    ]) {
      registerCanvasContribution(ctx, contribution);
    }

    ctx.register(
      new CanvasI18nBundle(),
      new CanvasTextLayer(),
      new CanvasImageLayer(),
      new CanvasRectLayer(),
      new CanvasCircleLayer(),
      new AbsoluteEditorPaneContribution(),
      new InsertCanvasTextCommand(),
      new InsertCanvasImageCommand(),
      new InsertCanvasRectCommand(),
      new InsertCanvasCircleCommand(),
      new ResizePagePresetCommand(),
      new SetPageSizeCommand(),
      new SetPagePresetCommand(),
      new UpdateLayerTransformCommand(),
      new RotateLayerLeftCommand(),
      new RotateLayerRightCommand(),
      new UpdateRichTextTransformCommand(),
      new ExportImageCommand(),
      new UploadAssetCommand(),
      new CopyLayersCommand(),
      new PasteLayersCommand(),
      new PasteExternalLayersCommand(),
      new DuplicateLayersCommand(),
      new CopyLayersShortcut(),
      new PasteLayersShortcut(),
      new DuplicateLayersShortcut(),
      new DeleteLayerShortcut(),
      new BackspaceDeleteLayerShortcut(),
      new CanvasContextMenu(),
      new CanvasCommandPaletteItems(),
      new CanvasSidebarContainer(),
      new CanvasPagesView(),
      new CanvasLayersView(),
      new CanvasStatusBarContribution(),
      new CanvasToolbarContribution(),
      new CanvasZoomInCommand(),
      new CanvasZoomOutCommand(),
      new CanvasZoomTo100Command(),
      new CanvasZoomToFitCommand(),
      new CanvasZoomResetCommand(),
      new SingletonServiceContribution(AssetServiceId, InMemoryAssetService),
      new SingletonServiceContribution(
        CanvasCommandRequestServiceId,
        CanvasCommandRequestService
      ),
      new SingletonServiceContribution(
        CanvasClipboardServiceId,
        CanvasClipboardService
      ),
      new SimpleServiceContribution(CanvasPageResizeServiceId, () => ({
        resizeSceneToPreset: resizeSceneToPagePreset,
      })),
      new SimpleServiceContribution(
        CanvasFontServiceId,
        () => canvasFontService
      )
    );
  }

  deactivate(ctx: PluginContext): void {
    const assets = ctx.services.get(AssetServiceId);
    if ('dispose' in assets && typeof assets.dispose === 'function') {
      assets.dispose();
    }
  }
}

export function createCanvasDemoScene() {
  const { width: pageWidth, height: pageHeight } = getDefaultPageDimensions();

  return normalizeScene({
    activePageId: 'canvas-page',
    pages: [
      {
        id: 'canvas-page',
        name: 'Artboard',
        layout: 'absolute',
        width: pageWidth,
        height: pageHeight,
        layers: [
          // {
          //   id: 'image',
          //   type: 'canvas.image',
          //   editable: false,
          //   data: {
          //     assetRef: imageUrl,
          //     alt: 'Image',
          //   },
          //   transform: {
          //     ...createDefaultTransform(),
          //     x: 0,
          //     y: 0,
          //     width: pageWidth,
          //     height: pageHeight,
          //   },
          // },
          // {
          //   id: 'text',
          //   type: 'canvas.text',
          //   editable: true,
          //   data: {
          //     html: '<p>Warszawski developer</p>',
          //     fontSize: 72,
          //     fontFamily: '"Parisienne", cursive',
          //     fill: '#000000',
          //     align: 'center',
          //   },
          //   transform: {
          //     ...createDefaultTransform(),
          //     x: 40,
          //     y: 180,
          //     width: pageWidth - 80,
          //     height: 211,
          //   },
          // },
          // {
          //   id: 'group',
          //   type: 'canvas.rect',
          //   editable: false,
          //   data: {
          //     fill: 'transparent',
          //     stroke: 'transparent',
          //     strokeWidth: 0,
          //     cornerRadius: 0,
          //   },
          //   transform: {
          //     ...createDefaultTransform(),
          //     x: pageWidth / 2,
          //     y: pageHeight / 2,
          //     width: 0,
          //     height: 0,
          //     rotation: 263,
          //   },
          // },
        ],
      },
    ],
    selection: {
      activePageId: 'canvas-page',
      primaryLayerId: 'text',
      selectedLayerIds: ['text'],
    },
  });
}
