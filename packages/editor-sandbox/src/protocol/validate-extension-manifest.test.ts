import { describe, expect, it } from 'vitest';

import { validateExtensionManifest } from './validate-extension-manifest';

describe(validateExtensionManifest, () => {
  it('accepts a minimal valid manifest', () => {
    const result = validateExtensionManifest({
      id: 'wm.wedding',
      name: 'Wedding',
      contributes: {
        widgets: [
          {
            id: 'wm.wedding.countdown',
            label: 'Countdown',
            kinds: ['html'],
          },
        ],
        commands: [{ id: 'wm.wedding.rsvp', title: 'Submit RSVP' }],
        viewContainers: [{ id: 'wm.wedding', title: 'Wedding' }],
        views: [{ id: 'wm.wedding.guests', container: 'wm.wedding' }],
      },
    });
    expect(result.ok).toBe(true);
  });

  it('rejects unknown permissions', () => {
    const result = validateExtensionManifest({
      id: 'x',
      name: 'X',
      permissions: ['not-a-cap'],
      contributes: {},
    });
    expect(result.ok).toBe(false);
  });
});
