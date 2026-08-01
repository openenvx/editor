import { describe, expect, it } from 'vitest';

import { createCommandPaletteBuilder } from '../builders/command-palette-builder';
import { createManifestContributions } from './create-manifest-contributions';
import { n } from './test-node';

describe('createManifestContributions', () => {
  it('rejects invalid manifest roots', () => {
    const result = createManifestContributions(
      {
        menu: n('Toolbar', null, n('ToolbarCommand', { id: 'x', commandId: 'a' })),
      },
      { allowedCommands: ['a'] }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/menu: expected Menu/);
    }
  });

  it('filters command ids through allowedCommands at contribute time', () => {
    const result = createManifestContributions(
      {
        menu: n(
          'Menu',
          null,
          n('Item', { commandId: 'allowed.save', label: 'Save' }),
          n('Item', { commandId: 'evil.wipe', label: 'Wipe' })
        ),
      },
      { allowedCommands: ['allowed.save'] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.contributions).toHaveLength(1);
  });

  it('denies all chrome commands when allowedCommands is empty', () => {
    const result = createManifestContributions(
      {
        palette: n(
          'Palette',
          null,
          n('PaletteItem', { commandId: 'any.command', label: 'Any' })
        ),
      },
      { allowedCommands: [] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.contributions).toHaveLength(1);
    const builder = createCommandPaletteBuilder();
    result.contributions[0]!.contribute(builder, {} as never);
    expect(builder.build().overrides).toEqual([]);
  });
});
