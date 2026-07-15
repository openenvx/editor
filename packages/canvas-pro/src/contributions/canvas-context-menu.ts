import type { ContributionBuildContext } from '@openenvx/core';
import { ContextMenuContribution, type MenuBuilder } from '@openenvx/headless';

export class CanvasContextMenu extends ContextMenuContribution {
  contribute(builder: MenuBuilder, ctx: ContributionBuildContext): void {
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
    builder
      .item('canvas.resetImageCrop')
      .label(ctx.t('canvas.command.resetImageCrop', 'Reset crop'))
      .when('scene.layerSelected');
  }
}
