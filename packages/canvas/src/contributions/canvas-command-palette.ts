import {
  type ContributionBuildContext,
  CommandPaletteContribution,
  type CommandPaletteBuilder,
} from '@openenvx/core';

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
      .item('canvas.groupSelection')
      .label(ctx.t('canvas.command.group', 'Create group'))
      .category('canvas')
      .keywords('group', 'combine')
      .when('page.layoutAbsolute && scene.multiSelect');
    builder
      .item('canvas.ungroup')
      .label(ctx.t('canvas.command.ungroup', 'Ungroup'))
      .category('canvas')
      .keywords('ungroup', 'split')
      .when(
        "page.layoutAbsolute && scene.layerSelected && scene.primaryLayerType == 'canvas.group'"
      );
    builder
      .item('canvas.insertImage')
      .label(ctx.t('canvas.command.image', 'Image'))
      .tab('assets')
      .keywords('photo', 'picture');
    builder
      .item('canvas.insertQr')
      .label(ctx.t('canvas.command.qr', 'QR code'))
      .tab('assets')
      .keywords('qr', 'barcode', 'link');
    builder
      .item('canvas.uploadAsset')
      .label(ctx.t('canvas.command.uploadAsset', 'Upload asset'))
      .tab('assets')
      .keywords('import', 'file');
    builder.item('canvas.pasteExternal').hide();

    builder
      .item('scene.addPage')
      .label(ctx.t('canvas.command.addPage', 'Add page'))
      .category('canvas')
      .keywords('page', 'new');
    builder
      .item('scene.duplicatePage')
      .label(ctx.t('canvas.command.duplicatePage', 'Duplicate page'))
      .category('canvas')
      .keywords('page', 'copy');
    builder
      .item('scene.removePage')
      .label(ctx.t('canvas.command.removePage', 'Delete page'))
      .category('canvas')
      .keywords('page', 'delete')
      .when('scene.multiPage');
  }
}
