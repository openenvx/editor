import { h, Item, Menu, Toolbar, ToolbarCommand } from '@xmazu/openenvxee-plugin-protocol';
import { describe, expect, it } from 'vitest';

import { createManifestContributions } from './create-manifest-contributions';

describe('createManifestContributions', () => {
  it('rejects invalid manifest roots', () => {
    const result = createManifestContributions(
      {
        menu: h(Toolbar, null, h(ToolbarCommand, { id: 'x', commandId: 'a' })),
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
        menu: h(
          Menu,
          null,
          h(Item, { commandId: 'allowed.save', label: 'Save' }),
          h(Item, { commandId: 'evil.wipe', label: 'Wipe' })
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
});
