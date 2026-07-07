import { ContextMenuContribution } from '@openenvx/core';
import type {
  ContributionBuildContext,
  createMenuBuilder,
} from '@openenvx/core';

export class CanvasContextMenu extends ContextMenuContribution {
  contribute(
    builder: ReturnType<typeof createMenuBuilder>,
    ctx: ContributionBuildContext
  ): void {
    builder
      .item('canvas.copy')
      .label(ctx.t('canvas.command.copy', 'Copy'))
      .when('page.layoutAbsolute && scene.layerSelected');
    builder
      .item('canvas.duplicate')
      .label(ctx.t('canvas.command.duplicate', 'Duplicate'))
      .when('page.layoutAbsolute && scene.layerSelected');
    builder
      .item('canvas.paste')
      .label(ctx.t('canvas.command.paste', 'Paste'))
      .when('page.layoutAbsolute');
    builder
      .item('scene.deleteLayer')
      .label(ctx.t('canvas.command.delete', 'Delete'))
      .when('scene.layerSelected');
    builder
      .item('scene.moveUp')
      .label(ctx.t('canvas.command.moveUp', 'Move up'))
      .when('scene.layerSelected');
    builder
      .item('scene.moveDown')
      .label(ctx.t('canvas.command.moveDown', 'Move down'))
      .when('scene.layerSelected');
  }
}
