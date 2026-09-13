import { DialogServiceId, WorkbenchNavigationServiceId } from '@openenvx/core';
import { normalizeScene } from '@openenvx/core/schema';
import { describe, expect, it, vi } from 'vitest';

import { VARIABLES_EDIT_DIALOG_ID } from './constants';
import { CreateVariableCommand, EditVariableCommand } from './variables-plugin';

function createCommandContext(sceneOverrides: Record<string, unknown> = {}) {
  const scene = normalizeScene({
    pages: [{ id: 'p1', name: 'Page', layout: 'absolute', layers: [] }],
    variables: [{ id: 'var-1', key: 'name', label: 'Name' }],
    ...sceneOverrides,
  });
  const open = vi.fn();
  const setSecondarySidebarVisible = vi.fn();
  const setActiveContainer = vi.fn();

  return {
    open,
    scene: { getScene: () => scene },
    services: {
      get: (id: unknown) => {
        if (id === DialogServiceId) {
          return { open };
        }
        if (id === WorkbenchNavigationServiceId) {
          return { setActiveContainer, setSecondarySidebarVisible };
        }
      },
    },
  };
}

describe('VariablesPlugin commands', () => {
  it('opens create dialog with create payload', () => {
    const ctx = createCommandContext();
    const command = new CreateVariableCommand();

    command.execute(ctx as never);

    expect(ctx.open).toHaveBeenCalledWith(VARIABLES_EDIT_DIALOG_ID, {
      mode: 'create',
    });
  });

  it('opens edit dialog with variable payload', () => {
    const ctx = createCommandContext();
    const command = new EditVariableCommand();

    expect(command.canExecute(ctx as never, { id: 'var-1' })).toBe(true);
    command.execute(ctx as never, { id: 'var-1' });

    expect(ctx.open).toHaveBeenCalledWith(VARIABLES_EDIT_DIALOG_ID, {
      mode: 'edit',
      variable: expect.objectContaining({ id: 'var-1', key: 'name' }),
    });
  });
});
