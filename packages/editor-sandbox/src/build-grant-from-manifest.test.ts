import { describe, expect, it } from 'vitest';

import { buildGrantFromManifest } from './build-grant-from-manifest';

describe('buildGrantFromManifest', () => {
  it('intersects permissions and requestedCommands with session policy', () => {
    const grant = buildGrantFromManifest({
      manifest: {
        id: 'wm.demo',
        name: 'Demo',
        permissions: ['widget:render', 'widget:values', 'document:write'],
        requestedCommands: ['canvas.insertRect', 'evil.cmd'],
        contributes: {},
      },
      session: {
        kind: 'widget',
        capabilities: ['widget:render', 'widget:values', 'ui:show'],
        allowedCommands: ['canvas.insertRect', 'canvas.insertText'],
      },
    });
    expect(grant.id).toBe('wm.demo');
    expect(grant.kind).toBe('widget');
    expect(grant.capabilities).toEqual(['widget:render', 'widget:values']);
    expect(grant.allowedCommands).toEqual(['canvas.insertRect']);
    expect(grant.title).toBe('Demo');
  });

  it('defaults requestedCommands to [] (never infers contributes.commands)', () => {
    const grant = buildGrantFromManifest({
      manifest: {
        id: 'wm.chrome',
        name: 'Chrome',
        contributes: {
          commands: [{ id: 'canvas.insertRect', title: 'Insert' }],
        },
      },
      session: {
        kind: 'widget',
        capabilities: ['widget:render'],
        allowedCommands: ['canvas.insertRect'],
      },
    });
    expect(grant.allowedCommands).toEqual([]);
  });
});
