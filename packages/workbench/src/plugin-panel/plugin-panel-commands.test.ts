import type { PluginPanelDeclaration } from '@openenvx/protocol';
import { describe, expect, it } from 'vitest';

import { canRunPluginPanelCommand } from './plugin-panel-command-gate';

const declaration = {
  id: 'test',
  title: 'Test',
  allowedCommands: ['canvas.image.replace'],
  contextScope: 'selection',
} satisfies PluginPanelDeclaration;

describe('canRunPluginPanelCommand', () => {
  it('rejects commands outside the allowlist', () => {
    expect(
      canRunPluginPanelCommand(declaration, 'edit', 'canvas.delete')
    ).toBe(false);
  });

  it('rejects commands when session is read-only', () => {
    expect(
      canRunPluginPanelCommand(
        declaration,
        'read',
        'canvas.image.replace'
      )
    ).toBe(false);
  });

  it('allows declared commands when editable', () => {
    expect(
      canRunPluginPanelCommand(
        declaration,
        'edit',
        'canvas.image.replace'
      )
    ).toBe(true);
  });
});
