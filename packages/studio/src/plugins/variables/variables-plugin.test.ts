import {
  DialogServiceId,
  LocalizationServiceId,
  WorkbenchNavigationServiceId,
} from '@openenvx/studio/core';
import { normalizeScene } from '@openenvx/studio/schema';
import { describe, expect, it, vi } from 'vitest';

import { LocalizationServiceImpl } from '../../core/i18n/localization-service';
import { registerWorkbenchLocalizationBundles } from '../../i18n/workbench-i18n';
import { InstantiationService } from '../../core/runtime/instantiation-service';
import { SceneStore } from '../../core/scene/scene-store';
import { CreateVariableCommand, EditVariableCommand } from './variables-plugin';
import { VARIABLE_FORM_DELETE_ACTION } from './variable-form';

function createCommandContext(sceneOverrides: Record<string, unknown> = {}) {
  const sceneStore = new SceneStore(
    normalizeScene({
      pages: [{ id: 'p1', name: 'Page', layout: 'absolute', layers: [] }],
      variables: [{ id: 'var-1', key: 'name' }],
      ...sceneOverrides,
    })
  );
  const showForm = vi.fn();
  const setSecondarySidebarVisible = vi.fn();
  const setActiveContainer = vi.fn();
  const services = new InstantiationService();
  const localization = new LocalizationServiceImpl();
  registerWorkbenchLocalizationBundles(localization);
  services.registerInstance(LocalizationServiceId, localization);

  return {
    editor: {} as never,
    events: { emit: vi.fn() } as never,
    scene: sceneStore,
    selection: {
      activeArtboardId: 'p1',
      primaryNodeId: null,
      selectedNodeIds: [],
    },
    services: {
      ...services,
      get: (id: unknown) => {
        if (id === DialogServiceId) {
          return { showForm };
        }
        if (id === WorkbenchNavigationServiceId) {
          return { setActiveContainer, setSecondarySidebarVisible };
        }
        return services.get(id as never);
      },
      has: (id: unknown) =>
        id === DialogServiceId ||
        id === WorkbenchNavigationServiceId ||
        services.has(id as never),
    },
    showForm,
    setActiveContainer,
    setSecondarySidebarVisible,
  };
}

describe('VariablesPlugin commands', () => {
  it('opens create form with create mode', async () => {
    const ctx = createCommandContext();
    const command = new CreateVariableCommand();

    ctx.showForm.mockResolvedValue({
      action: 'submit',
      values: { key: 'email', sample: 'you@example.com' },
    });

    await command.execute(ctx as never);

    expect(ctx.showForm).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ key: expect.any(String) }),
      })
    );
    expect(ctx.scene.getDocument().variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'email', sample: 'you@example.com' }),
      ])
    );
  });

  it('opens edit form for an existing variable', async () => {
    const ctx = createCommandContext();
    const command = new EditVariableCommand();

    expect(command.canExecute(ctx as never, { id: 'var-1' })).toBe(true);

    ctx.showForm.mockResolvedValue({
      action: 'submit',
      values: { key: 'renamed', sample: 'x' },
    });

    await command.execute(ctx as never, { id: 'var-1' });

    expect(ctx.showForm).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ key: 'name' }),
      })
    );
    expect(ctx.scene.getDocument().variables[0]).toMatchObject({
      id: 'var-1',
      key: 'renamed',
      sample: 'x',
    });
  });

  it('removes variable when delete extra action is chosen', async () => {
    const ctx = createCommandContext();
    const command = new EditVariableCommand();

    ctx.showForm.mockResolvedValue({
      action: VARIABLE_FORM_DELETE_ACTION,
      values: { key: 'name', sample: '' },
    });

    await command.execute(ctx as never, { id: 'var-1' });

    expect(ctx.scene.getDocument().variables).toHaveLength(0);
  });
});
