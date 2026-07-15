import type { ContributionBuildContext } from '@openenvx/core';
import {
  CommandPaletteContribution,
  type CommandPaletteBuilder,
} from '@openenvx/headless';

export class CanvasCommandPaletteItems extends CommandPaletteContribution {
  contribute(
    builder: CommandPaletteBuilder,
    ctx: ContributionBuildContext
  ): void {
    builder.category(
      'canvas',
      ctx.t('canvas.commandPalette.category', 'Canvas')
    );
    builder.tab('assets', ctx.t('canvas.commandPalette.tab.assets', 'Assets'));

    builder
      .item('canvas.copy')
      .label(ctx.t('canvas.command.copy', 'Copy'))
      .category('canvas')
      .when('page.layoutAbsolute && scene.layerSelected');
    builder
      .item('canvas.duplicate')
      .label(ctx.t('canvas.command.duplicate', 'Duplicate'))
      .category('canvas')
      .when('page.layoutAbsolute && scene.layerSelected');
    builder
      .item('canvas.paste')
      .label(ctx.t('canvas.command.paste', 'Paste'))
      .category('canvas')
      .when('page.layoutAbsolute');
    builder
      .item('canvas.insertImage')
      .label(ctx.t('canvas.command.image', 'Image'))
      .tab('assets')
      .keywords('photo', 'picture');
    builder
      .item('canvas.uploadAsset')
      .label(ctx.t('canvas.command.uploadAsset', 'Upload asset'))
      .tab('assets')
      .keywords('import', 'file');
    builder.item('canvas.pasteExternal').hide();
  }
}
