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
} from '@openenvx/studio/core';
import type {
  CommandContext,
  DocumentNode,
  PluginContext,
  WorkbenchPluginContext,
} from '@openenvx/studio/core';
import {
  applyNodeTransform,
  artboardRulesLayout,
  createDefaultTransform,
  normalizeScene,
  withArtboardRulesLayout,
} from '@openenvx/studio/schema';

import { AbsolutePageRules } from '../absolute-page-rules';
import {
  CanvasClipboardServiceId,
  CanvasCommandRequestServiceId,
  CanvasGridSettingsServiceId,
  CanvasMarginsSettingsServiceId,
  CanvasPageResizeServiceId,
  CanvasRulerGuidesSettingsServiceId,
  CanvasStageInteractionServiceId,
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
  AlignLayersBottomCommand,
  AlignLayersCenterCommand,
  AlignLayersLeftCommand,
  AlignLayersMiddleCommand,
  AlignLayersRightCommand,
  AlignLayersTopCommand,
  DistributeLayersHorizontallyCommand,
} from '../commands/align-layers-commands';
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
import { ToggleCanvasMarginsCommand } from '../commands/canvas-margins-commands';
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
import { ResetImageCropCommand } from '../commands/reset-image-crop-command';
import { DetachWidgetCommand } from '../commands/widget-detach-command';
import { createCanvasChromeCommands } from '../contributions/canvas-chrome-commands';
import { CanvasCommandPaletteItems } from '../contributions/canvas-command-palette';
import { CanvasContextMenu } from '../contributions/canvas-context-menu';
import { canvasPropertyPaneContributions } from '../contributions/canvas-property-pane-contributions';
import {
  CanvasStatusBarContribution,
  CanvasToolbarContribution,
} from '../contributions/canvas-shell-contributions';
import { CanvasTopBarContribution } from '../contributions/canvas-top-bar-contribution';
import { proImageCanvasContributions } from '../contributions/pro-image-contributions';
import { bindCanvasDisplayContextKeys } from '../display/bind-canvas-display-context-keys';
import { CanvasMarginsSettings } from '../display/canvas-margins-settings';
import { AbsoluteEditorPane } from '../editor/absolute-editor-pane';
import { BrowserCanvasDocumentExportService } from '../export/browser/canvas-document-export-service';
import { CanvasDocumentExportServiceId } from '../export/canvas-document-export-service';
import { SvgNodesFieldRenderer } from '../fields/svg-nodes-field';
import { canvasFontService } from '../fonts/canvas-font-service';
import { CanvasGridSettings } from '../grid/canvas-grid-settings';
import { CanvasI18nBundle } from '../i18n/canvas-i18n-bundle';
import { builtinCanvasLayerDefinitions } from '../layers/builtin-canvas-layer-definitions';
import { CanvasCircleLayer } from '../layers/canvas-circle-layer';
import { CanvasImageLayer } from '../layers/canvas-image-layer';
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
import { SmartGuidesStageInteraction } from '../stage/smart-guides-stage-interaction';
import {
  ensureCanvasRegistriesInstalled,
  registerCanvasContribution,
} from './canvas-registry-service';

function createLayerId(type: string): string {
  return `${type}-${crypto.randomUUID()}`;
}

function insertCanvasLayer(ctx: CommandContext, layer: DocumentNode): void {
  const page = ctx.scene.getActiveArtboard();
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      artboards: scene.artboards.map((p) =>
        p.id === page.id ? { ...p, nodes: [...p.nodes, layer] } : p
      ),
    }),
    label: localize(ctx.services, 'canvas.history.insertLayer', {
      defaultValue: 'Insert layer',
    }),
  });
  ctx.scene.setSelection({
    activeArtboardId: page.id,
    primaryNodeId: layer.id,
    selectedNodeIds: [layer.id],
  });
}

function canInsertOnActivePage(ctx: CommandContext): boolean {
  const scene = ctx.scene.getDocument();
  return (
    artboardRulesLayout(ctx.scene.getActiveArtboard()) === 'absolute' &&
    canInsertLayers(scene)
  );
}

export class InsertCanvasTextCommand extends Command {
  readonly id = 'canvas.insertText';

  canExecute(ctx: CommandContext): boolean {
    return canInsertOnActivePage(ctx);
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActiveArtboard();
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
    const page = ctx.scene.getActiveArtboard();
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
      layer.props = {
        ...layer.props,
        extensionId,
        label: extensionId,
        values: {},
      };
      layer.children = [];
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
    const page = ctx.scene.getActiveArtboard();
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
    const page = ctx.scene.getActiveArtboard();
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
    const page = ctx.scene.getActiveArtboard();
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
    const page = ctx.scene.getActiveArtboard();
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
    const page = ctx.scene.getActiveArtboard();
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
        const page = ctx.scene.getActiveArtboard();
        const layer = new CanvasImageLayer().createDefault(
          createLayerId('image'),
          page
        );
        layer.props = { ...layer.props, alt: file.name, assetRef };
        insertCanvasLayer(ctx, layer);
        resolve();
      };
    });
  }
}

export class CanvasPlugin extends Plugin {
  readonly id = 'openenvx.canvas';

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
      ...builtinCanvasLayerDefinitions(),
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
      new ToggleCanvasMarginsCommand(),
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
      new SingletonServiceContribution(
        CanvasMarginsSettingsServiceId,
        CanvasMarginsSettings
      ),
      new SimpleServiceContribution(CanvasPageResizeServiceId, () => ({
        resizeSceneToPreset: resizeSceneToPagePreset,
      })),
      new SimpleServiceContribution(FontServiceId, () => canvasFontService),
      new SingletonServiceContribution(
        CanvasDocumentExportServiceId,
        BrowserCanvasDocumentExportService
      )
    );

    bindCanvasDisplayContextKeys(ctx);

    const workbench = ctx as WorkbenchPluginContext;
    ctx.register(...createCanvasChromeCommands());
    workbench.registerEditorPane('absolute', AbsoluteEditorPane);
    workbench.registerFieldRenderer('svgNodes', SvgNodesFieldRenderer);
    workbench.registerWorkbench(
      new CanvasContextMenu(),
      new CanvasCommandPaletteItems(),
      new CanvasStatusBarContribution(),
      new CanvasToolbarContribution(),
      new CanvasTopBarContribution(),
      ...canvasPropertyPaneContributions
    );
    ctx.register(
      new SingletonServiceContribution(
        CanvasStageInteractionServiceId,
        SmartGuidesStageInteraction
      )
    );
    registerCanvasContribution(ctx, [...proImageCanvasContributions], {
      override: true,
    });
    ctx.register(
      new AlignLayersLeftCommand(),
      new AlignLayersCenterCommand(),
      new AlignLayersRightCommand(),
      new AlignLayersTopCommand(),
      new AlignLayersMiddleCommand(),
      new AlignLayersBottomCommand(),
      new DistributeLayersHorizontallyCommand(),
      new ResetImageCropCommand()
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
  const margin = 48;

  return normalizeScene({
    artboards: [
      withArtboardRulesLayout(
        {
          id: 'canvas-page',
          name: 'Artboard',
          space: { width: pageWidth, height: pageHeight },
          nodes: [
            applyNodeTransform(
              {
                id: 'demo-heading',
                type: 'canvas.text',
                writeMode: 'content',
                props: {
                  html: '<p>Canvas demo</p>',
                  fontSize: 48,
                  fontFamily: 'Inter, sans-serif',
                  fill: '#ffffff',
                  align: 'center',
                },
              },
              {
                ...createDefaultTransform(),
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                x: margin,
                y: pageHeight * 0.4,
                width: pageWidth - margin * 2,
                height: 80,
              }
            ),
          ],
        },
        'absolute'
      ),
    ],
  });
}
