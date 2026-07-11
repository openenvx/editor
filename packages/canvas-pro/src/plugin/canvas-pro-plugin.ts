import { CanvasStageInteractionServiceId } from '@openenvx/canvas';
import { Plugin, SingletonServiceContribution } from '@openenvx/core';
import type { PluginContext } from '@openenvx/core';

import {
  AlignLayersBottomCommand,
  AlignLayersCenterCommand,
  AlignLayersLeftCommand,
  AlignLayersMiddleCommand,
  AlignLayersRightCommand,
  AlignLayersTopCommand,
  DistributeLayersHorizontallyCommand,
} from '../commands/align-layers-commands';
import { SmartGuidesStageInteraction } from '../stage/smart-guides-stage-interaction';

export class CanvasProPlugin extends Plugin {
  readonly id = 'openenvx.canvas-pro';

  activate(ctx: PluginContext): void {
    ctx.register(
      new SingletonServiceContribution(
        CanvasStageInteractionServiceId,
        SmartGuidesStageInteraction
      )
    );
    ctx.register(new AlignLayersLeftCommand());
    ctx.register(new AlignLayersCenterCommand());
    ctx.register(new AlignLayersRightCommand());
    ctx.register(new AlignLayersTopCommand());
    ctx.register(new AlignLayersMiddleCommand());
    ctx.register(new AlignLayersBottomCommand());
    ctx.register(new DistributeLayersHorizontallyCommand());
  }
}
