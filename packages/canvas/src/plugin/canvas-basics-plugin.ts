import {
  Command,
  canInsertLayers,
  InMemoryAssetService,
  localize,
  AssetServiceId,
  FontServiceId,
  Plugin,
  SimpleServiceContribution,
  SingletonServiceContribution,
} from '@openenvx/core';
import type { CommandContext, Layer, PluginContext } from '@openenvx/core';
import { normalizeScene } from '@xmazu/openenvxee-schema';

import { AbsolutePageRules } from '../absolute-page-rules';
import {
  CanvasClipboardServiceId,
  CanvasCommandRequestServiceId,
  CanvasGridSettingsServiceId,
  CanvasPageResizeServiceId,
  CanvasRulerGuidesSettingsServiceId,
} from '../canvas-service-tokens';
import {
  CopyLayersCommand,
  CopyLayersShortcut,
  DuplicateLayersCommand,
  DuplicateLayersShortcut,
  PasteExternalLayersCommand,
  PasteLayersCommand,
  PasteLayersShortcut,
} from '../clipboard/canvas-clipboard-contributions';
import { CanvasClipboardService } from '../clipboard/canvas-clipboard-service';
import {
  ExportImageCommand,
  RegisterCanvasFontCommand,
  ResizePagePresetCommand,
  SetPagePresetCommand,
  SetPageSizeCommand,
  SetBleedMmCommand,
  SetSafeMmCommand,
  UpdateLayerTransformCommand,
  SetLayerRotationCommand,
  UpdateRichTextTransformCommand,
  RotateLayerLeftCommand,
  RotateLayerRightCommand,
} from '../commands/canvas-api-commands';
import { CanvasCommandRequestService } from '../commands/canvas-command-request-service';
import {
  CreateComponentFromSelectionCommand,
  InsertComponentInstanceCommand,
  UpdateComponentDefinitionCommand,
} from '../commands/canvas-component-commands';
import {
  SetCanvasGridSizeCommand,
  ToggleCanvasGridCommand,
} from '../commands/canvas-grid-commands';
import {
  GroupSelectionCommand,
  InsertCanvasGroupCommand,
  UngroupSelectionCommand,
} from '../commands/canvas-group-commands';
import {
  AddCanvasGuideCommand,
  ClearCanvasGuidesCommand,
  MoveCanvasGuideCommand,
  RemoveCanvasGuideCommand,
  ToggleCanvasRulersCommand,
} from '../commands/canvas-ruler-commands';
import {
  CanvasZoomInCommand,
  CanvasZoomOutCommand,
  CanvasZoomResetCommand,
  CanvasZoomTo100Command,
  CanvasZoomToFitCommand,
} from '../commands/canvas-zoom-commands';
import { DetachWidgetCommand } from '../commands/widget-detach-command';
import { canvasFontService } from '../fonts/canvas-font-service';
import { CanvasGridSettings } from '../grid/canvas-grid-settings';
import { CanvasI18nBundle } from '../i18n/canvas-i18n-bundle';
import { CanvasCircleLayer } from '../layers/canvas-circle-layer';
import { CanvasGroupLayer } from '../layers/canvas-group-layer';
import { CanvasImageLayer } from '../layers/canvas-image-layer';
import { CanvasInstanceLayer } from '../layers/canvas-instance-layer';
import { CanvasQrLayer } from '../layers/canvas-qr-layer';
import { CanvasRectLayer } from '../layers/canvas-rect-layer';
import { CanvasSvgLayer } from '../layers/canvas-svg-layer';
import { CanvasTextLayer } from '../layers/canvas-text-layer';
import { OpenEnvxWidgetLayer } from '../layers/openenvx-widget-layer';
import { getDefaultPageDimensions } from '../page-presets';
import { resizeSceneToPagePreset } from '../page-resize/apply-page-preset-resize';
import {
  builtinCanvasInteractionContributions,
  builtinCanvasRendererContributions,
  builtinLayerPreviewRendererContributions,
} from '../renderers/builtin-contributions';
import { CanvasRulerGuidesSettings } from '../rulers/canvas-ruler-guides-settings';
import {
  ensureCanvasRegistriesInstalled,
  registerCanvasContribution,
} from './canvas-registry-service';

function createLayerId(type: string): string {
  return `${type}-${crypto.randomUUID()}`;
}

function insertCanvasLayer(ctx: CommandContext, layer: Layer): void {
  const page = ctx.scene.getActivePage();
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      pages: scene.pages.map((p) =>
        p.id === page.id ? { ...p, layers: [...p.layers, layer] } : p
      ),
    }),
    label: localize(ctx.services, 'canvas.history.insertLayer', {
      defaultValue: 'Insert layer',
    }),
  });
  ctx.scene.setSelection({
    activePageId: page.id,
    primaryLayerId: layer.id,
    selectedLayerIds: [layer.id],
  });
}

function canInsertOnActivePage(ctx: CommandContext): boolean {
  const scene = ctx.scene.getScene();
  return (
    ctx.scene.getActivePage().layout === 'absolute' && canInsertLayers(scene)
  );
}

export class InsertCanvasTextCommand extends Command {
  readonly id = 'canvas.insertText';

  canExecute(ctx: CommandContext): boolean {
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActivePage();
    const layer = new CanvasTextLayer().createDefault(
      createLayerId('text'),
      page
    );
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertOpenEnvxWidgetCommand extends Command {
  readonly id = 'canvas.insertWidget';

  canExecute(ctx: CommandContext): boolean {
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const page = ctx.scene.getActivePage();
    const layer = new OpenEnvxWidgetLayer().createDefault(
      createLayerId('widget'),
      page
    );
    const extensionId =
      args &&
      typeof args === 'object' &&
      typeof (args as { extensionId?: unknown }).extensionId === 'string'
        ? (args as { extensionId: string }).extensionId.trim()
        : '';
    if (extensionId) {
      layer.data = {
        ...(layer.data as Record<string, unknown>),
        extensionId,
        label: extensionId,
        values: {},
        children: [],
      };
      layer.name = extensionId;
    }
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertCanvasImageCommand extends Command {
  readonly id = 'canvas.insertImage';

  canExecute(ctx: CommandContext): boolean {
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActivePage();
    const layer = new CanvasImageLayer().createDefault(
      createLayerId('image'),
      page
    );
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertCanvasSvgCommand extends Command {
  readonly id = 'canvas.insertSvg';

  canExecute(ctx: CommandContext): boolean {
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActivePage();
    const layer = new CanvasSvgLayer().createDefault(
      createLayerId('svg'),
      page
    );
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertCanvasQrCommand extends Command {
  readonly id = 'canvas.insertQr';

  canExecute(ctx: CommandContext): boolean {
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActivePage();
    const layer = new CanvasQrLayer().createDefault(createLayerId('qr'), page);
    insertCanvasLayer(ctx, layer);
  }
}

export class InsertCanvasRectCommand extends Command {
  readonly id = 'canvas.insertRect';

  canExecute(ctx: CommandContext): boolean {
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActivePage();
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
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActivePage();
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
    return canInsertOnActivePage(ctx);
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
        const page = ctx.scene.getActivePage();
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

export class CanvasBasicsPlugin extends Plugin {
  readonly id = 'OpenEnvx.canvas-basics';

  activate(ctx: PluginContext): void {
    ensureCanvasRegistriesInstalled(ctx);

    registerCanvasContribution(ctx, [
      ...builtinCanvasRendererContributions,
      ...builtinLayerPreviewRendererContributions,
      ...builtinCanvasInteractionContributions,
    ]);

    ctx.register(
      new AbsolutePageRules(),
      new CanvasI18nBundle(),
      new CanvasTextLayer(),
      new CanvasImageLayer(),
      new CanvasSvgLayer(),
      new CanvasQrLayer(),
      new CanvasRectLayer(),
      new CanvasCircleLayer(),
      new CanvasGroupLayer(),
      new CanvasInstanceLayer(),
      new OpenEnvxWidgetLayer(),
      new InsertCanvasTextCommand(),
      new InsertOpenEnvxWidgetCommand(),
      new DetachWidgetCommand(),
      new InsertCanvasImageCommand(),
      new InsertCanvasSvgCommand(),
      new InsertCanvasQrCommand(),
      new InsertCanvasRectCommand(),
      new InsertCanvasCircleCommand(),
      new InsertCanvasGroupCommand(),
      new GroupSelectionCommand(),
      new UngroupSelectionCommand(),
      new CreateComponentFromSelectionCommand(),
      new InsertComponentInstanceCommand(),
      new UpdateComponentDefinitionCommand(),
      new ResizePagePresetCommand(),
      new SetPageSizeCommand(),
      new SetPagePresetCommand(),
      new SetBleedMmCommand(),
      new SetSafeMmCommand(),
      new UpdateLayerTransformCommand(),
      new SetLayerRotationCommand(),
      new RotateLayerLeftCommand(),
      new RotateLayerRightCommand(),
      new UpdateRichTextTransformCommand(),
      new RegisterCanvasFontCommand(),
      new ExportImageCommand(),
      new UploadAssetCommand(),
      new CopyLayersCommand(),
      new PasteLayersCommand(),
      new PasteExternalLayersCommand(),
      new DuplicateLayersCommand(),
      new CopyLayersShortcut(),
      new PasteLayersShortcut(),
      new DuplicateLayersShortcut(),
      new CanvasZoomInCommand(),
      new CanvasZoomOutCommand(),
      new CanvasZoomTo100Command(),
      new CanvasZoomToFitCommand(),
      new CanvasZoomResetCommand(),
      new ToggleCanvasGridCommand(),
      new SetCanvasGridSizeCommand(),
      new ToggleCanvasRulersCommand(),
      new ClearCanvasGuidesCommand(),
      new AddCanvasGuideCommand(),
      new MoveCanvasGuideCommand(),
      new RemoveCanvasGuideCommand(),
      new SingletonServiceContribution(AssetServiceId, InMemoryAssetService),
      new SingletonServiceContribution(
        CanvasCommandRequestServiceId,
        CanvasCommandRequestService
      ),
      new SingletonServiceContribution(
        CanvasClipboardServiceId,
        CanvasClipboardService
      ),
      new SingletonServiceContribution(
        CanvasGridSettingsServiceId,
        CanvasGridSettings
      ),
      new SingletonServiceContribution(
        CanvasRulerGuidesSettingsServiceId,
        CanvasRulerGuidesSettings
      ),
      new SimpleServiceContribution(CanvasPageResizeServiceId, () => ({
        resizeSceneToPreset: resizeSceneToPagePreset,
      })),
      new SimpleServiceContribution(FontServiceId, () => canvasFontService)
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
  });
}
