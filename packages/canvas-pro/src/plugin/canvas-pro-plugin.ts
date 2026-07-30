import {
  AbsoluteEditorPane,
  CanvasDocumentExportServiceId,
  CanvasStageInteractionServiceId,
  registerCanvasContribution,
} from '@openenvx/canvas';
import { Plugin, SingletonServiceContribution } from '@openenvx/core';
import type { PluginContext } from '@openenvx/core';
import { registerPreviewKindSvgSerializer } from '@openenvx/driver-image';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import {
  AlignLayersBottomCommand,
  AlignLayersCenterCommand,
  AlignLayersLeftCommand,
  AlignLayersMiddleCommand,
  AlignLayersRightCommand,
  AlignLayersTopCommand,
  DistributeLayersHorizontallyCommand,
} from '../commands/align-layers-commands';
import { ResetImageCropCommand } from '../commands/reset-image-crop-command';
import { CanvasCommandPaletteItems } from '../contributions/canvas-command-palette';
import { CanvasContextMenu } from '../contributions/canvas-context-menu';
import { canvasPropertyPaneContributions } from '../contributions/canvas-property-pane-contributions';
import {
  CanvasStatusBarContribution,
  CanvasToolbarContribution,
} from '../contributions/canvas-shell-contributions';
import { proImageCanvasContributions } from '../contributions/pro-image-contributions';
import { ProImageSvgSerializer } from '../export/pro-image-svg-serializer';
import { SvgNodesFieldRenderer } from '../fields/svg-nodes-field';
import { SmartGuidesStageInteraction } from '../stage/smart-guides-stage-interaction';

export class CanvasProPlugin extends Plugin {
  readonly id = 'openenvx.canvas-pro';

  activate(ctx: PluginContext): void {
    const workbench = ctx as WorkbenchPluginContext;
    workbench.registerEditorPane('absolute', AbsoluteEditorPane);
    workbench.registerFieldRenderer('svgNodes', SvgNodesFieldRenderer);
    workbench.registerWorkbench(
      new CanvasContextMenu(),
      new CanvasCommandPaletteItems(),
      new CanvasStatusBarContribution(),
      new CanvasToolbarContribution(),
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
    if (ctx.services.has(CanvasDocumentExportServiceId)) {
      registerPreviewKindSvgSerializer(ctx, new ProImageSvgSerializer(), {
        override: true,
      });
    }
    ctx.register(new AlignLayersLeftCommand());
    ctx.register(new AlignLayersCenterCommand());
    ctx.register(new AlignLayersRightCommand());
    ctx.register(new AlignLayersTopCommand());
    ctx.register(new AlignLayersMiddleCommand());
    ctx.register(new AlignLayersBottomCommand());
    ctx.register(new DistributeLayersHorizontallyCommand());
    ctx.register(new ResetImageCropCommand());
  }
}
