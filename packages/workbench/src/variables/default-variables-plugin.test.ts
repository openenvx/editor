import { DialogServiceId, WorkbenchNavigationServiceId } from '@openenvx/core';
import { normalizeScene } from '@openenvx/core/schema';
import { describe, expect, it, vi } from 'vitest';

import { CreateVariableCommand, EditVariableCommand } from './default-variables-plugin';
import { WORKBENCH_VARIABLES_EDIT_DIALOG_ID } from './variable-edit-dialog';

function createCommandContext(sceneOverrides: Record<string, unknown> = {}) {
  const scene = normalizeScene({
    pages: [{ id: 'p1', name: 'Page', layout: 'email', layers: [] }],
    variables: [
      { id: 'var-1', key: 'name', label: 'Name', type: 'string', defaultValue: '' },
    ],
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

describe('DefaultVariablesPlugin commands', () => {
  it('opens create dialog with create payload', () => {
    const ctx = createCommandContext();
    const command = new CreateVariableCommand();

    command.execute(ctx as never);

    expect(ctx.open).toHaveBeenCalledWith(WORKBENCH_VARIABLES_EDIT_DIALOG_ID, {
      mode: 'create',
    });
  });

  it('opens edit dialog with variable payload', () => {
    const ctx = createCommandContext();
    const command = new EditVariableCommand();

    expect(command.canExecute(ctx as never, { id: 'var-1' })).toBe(true);
    command.execute(ctx as never, { id: 'var-1' });

    expect(ctx.open).toHaveBeenCalledWith(WORKBENCH_VARIABLES_EDIT_DIALOG_ID, {
      mode: 'edit',
      variable: expect.objectContaining({ id: 'var-1', key: 'name' }),
    });
  });
});
