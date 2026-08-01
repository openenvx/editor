import { describe, expect, it } from 'vitest';

import { createExtensionContributions } from './create-extension-contributions';

const baseManifest = {
  id: 'ext.demo',
  name: 'Demo',
  version: '1.0.0',
  contributes: {
    commands: [
      { id: 'ext.demo.run', title: 'Run' },
      { id: 'ext.demo.other', title: 'Other' },
    ],
  },
};

describe('createExtensionContributions', () => {
  it('surfaces no palette commands when grant allowedCommands is empty', () => {
    const result = createExtensionContributions(baseManifest, {
      grant: {
        capabilities: ['ui:show'],
        allowedCommands: [],
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    // No CommandPaletteContribution when intersection is empty.
    expect(result.contributions).toHaveLength(0);
  });

  it('intersects grant allowlist with declared commands', () => {
    const result = createExtensionContributions(baseManifest, {
      grant: {
        capabilities: ['ui:show'],
        allowedCommands: ['ext.demo.run'],
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.contributions).toHaveLength(1);
  });
});
