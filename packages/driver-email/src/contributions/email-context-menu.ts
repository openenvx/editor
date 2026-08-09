import {
  type ContributionBuildContext,
  ContextMenuContribution,
  type MenuBuilder,
} from '@openenvx/core';

const EMAIL_LAYER_SELECTED = "page.layout == 'email' && scene.layerSelected";

export class EmailContextMenu extends ContextMenuContribution {
  contribute(builder: MenuBuilder, ctx: ContributionBuildContext): void {
    builder
      .item('email.duplicateBlock')
      .label(ctx.t('email.command.duplicate', 'Duplicate'))
      .when(EMAIL_LAYER_SELECTED);
    builder
      .item('email.removeBlock')
      .label(ctx.t('email.command.delete', 'Delete'))
      .when(EMAIL_LAYER_SELECTED);
    builder
      .item('email.moveBlockUp')
      .label(ctx.t('email.command.moveUp', 'Move up'))
      .when(EMAIL_LAYER_SELECTED);
    builder
      .item('email.moveBlockDown')
      .label(ctx.t('email.command.moveDown', 'Move down'))
      .when(EMAIL_LAYER_SELECTED);
  }
}
