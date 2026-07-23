import type { ContributionBuildContext } from '@openenvx/core';
import { ContextMenuContribution, type MenuBuilder } from '@openenvx/headless';

export class HtmlContextMenu extends ContextMenuContribution {
  contribute(builder: MenuBuilder, ctx: ContributionBuildContext): void {
    builder
      .item('html.duplicateBlock')
      .label(ctx.t('html.command.duplicate', 'Duplicate'))
      .when('scene.layerSelected');
    builder
      .item('html.removeBlock')
      .label(ctx.t('html.command.delete', 'Delete'))
      .when('scene.layerSelected');
    builder
      .item('html.moveBlockUp')
      .label(ctx.t('html.command.moveUp', 'Move up'))
      .when('scene.layerSelected');
    builder
      .item('html.moveBlockDown')
      .label(ctx.t('html.command.moveDown', 'Move down'))
      .when('scene.layerSelected');
    builder
      .item('scene.addPage')
      .label(ctx.t('html.command.addPage', 'Add page'))
      .when('!scene.layerSelected');
    builder
      .item('scene.duplicatePage')
      .label(ctx.t('html.command.duplicatePage', 'Duplicate page'))
      .when('!scene.layerSelected');
    builder
      .item('scene.removePage')
      .label(ctx.t('html.command.removePage', 'Delete page'))
      .when('!scene.layerSelected && scene.multiPage');
  }
}
