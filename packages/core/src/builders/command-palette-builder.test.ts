import { describe, expect, it } from 'vitest';

import {
  buildCommandPalette,
  createCommandPaletteBuilder,
  humanizeCommandId,
} from './command-palette-builder';

const identityT = (_key: string, defaultValue?: string) => defaultValue ?? _key;

describe(humanizeCommandId, () => {
  it('humanizes dotted command ids', () => {
    expect(humanizeCommandId('scene.undo')).toEqual({
      categoryId: 'scene',
      categoryLabel: 'Scene',
      label: 'Undo',
    });
  });

  it('humanizes single-segment command ids', () => {
    expect(humanizeCommandId('save')).toEqual({
      label: 'Save',
    });
  });
});

describe(buildCommandPalette, () => {
  it('auto-lists registered commands with humanized labels', () => {
    const palette = buildCommandPalette(
      ['scene.undo', 'canvas.copy'],
      [],
      () => true,
      identityT
    );

    expect(palette.items).toEqual([
      expect.objectContaining({
        commandId: 'canvas.copy',
        label: 'Copy',
        categoryId: 'canvas',
      }),
      expect.objectContaining({
        commandId: 'scene.undo',
        label: 'Undo',
        categoryId: 'scene',
      }),
    ]);
    expect(palette.tabs).toEqual([{ id: 'all', label: 'All' }]);
    expect(palette.categories).toEqual(
      expect.arrayContaining([
        { id: 'canvas', label: 'Canvas' },
        { id: 'scene', label: 'Scene' },
      ])
    );
  });

  it('applies contributed categories, enrichment, and hide rules', () => {
    const builder = createCommandPaletteBuilder();
    builder.category('file', 'File');
    builder.item('workbench.save').category('file').shortcut('Mod+S');
    builder.item('scene.debug').hide();

    const palette = buildCommandPalette(
      ['workbench.save', 'scene.debug', 'scene.undo'],
      [builder.build()],
      () => true,
      identityT
    );

    expect(palette.items.map((item) => item.commandId)).toEqual([
      'workbench.save',
      'scene.undo',
    ]);
    expect(
      palette.items.find((item) => item.commandId === 'workbench.save')
    ).toMatchObject({
      categoryId: 'file',
      shortcut: 'Mod+S',
    });
    expect(palette.categories).toContainEqual({ id: 'file', label: 'File' });
  });

  it('filters items by when expressions', () => {
    const builder = createCommandPaletteBuilder();
    builder.item('canvas.copy').when('scene.layerSelected');

    const palette = buildCommandPalette(
      ['canvas.copy', 'canvas.paste'],
      [builder.build()],
      (when) => when !== 'scene.layerSelected',
      identityT
    );

    expect(palette.items.map((item) => item.commandId)).toEqual([
      'canvas.paste',
    ]);
  });

  it('merges contributed tabs and assigns tabId to items', () => {
    const builder = createCommandPaletteBuilder();
    builder.tab('assets', 'Assets');
    builder.item('canvas.insertImage').tab('assets').label('Image');

    const palette = buildCommandPalette(
      ['canvas.insertImage', 'scene.undo'],
      [builder.build()],
      () => true,
      identityT
    );

    expect(palette.tabs).toEqual([
      { id: 'all', label: 'All' },
      { id: 'assets', label: 'Assets' },
    ]);
    expect(
      palette.items.find((item) => item.commandId === 'canvas.insertImage')
    ).toMatchObject({
      tabId: 'assets',
    });
    expect(
      palette.items.find((item) => item.commandId === 'scene.undo')?.tabId
    ).toBeUndefined();
  });
});
