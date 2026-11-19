import {
  DialogServiceId,
  LocalizationServiceId,
  WorkbenchNavigationServiceId,
  InstantiationService,
  LocalizationServiceImpl,
} from '@openenvx/studio';
import { normalizeDocument } from '@openenvx/editor/schema';
import { describe, expect, it, vi } from 'vitest';

import { registerWorkbenchLocalizationBundles } from '../../../../studio/src/i18n/workbench-i18n';
import { DocumentStoreServiceId } from '../../tokens';
import { createMockCommandContext } from '../../test/mock-command-context';
import { CreateVariableCommand, EditVariableCommand } from './variables-plugin';
import { VARIABLE_FORM_DELETE_ACTION } from './variable-form';

function createCommandContext(sceneOverrides: Record<string, unknown> = {}) {
  const document = normalizeDocument({
    pages: [{ id: 'p1', name: 'Page', layout: 'absolute', layers: [] }],
    variables: [{ id: 'var-1', key: 'name' }],
    ...sceneOverrides,
  });
  const showForm = vi.fn();
  const setSecondarySidebarVisible = vi.fn();
  const setActiveContainer = vi.fn();
  const services = new InstantiationService();
  const localization = new LocalizationServiceImpl();
  registerWorkbenchLocalizationBundles(localization);
  services.registerInstance(LocalizationServiceId, localization);
  services.registerInstance(DialogServiceId, { showForm });
  services.registerInstance(WorkbenchNavigationServiceId, {
    setActiveContainer,
    setSecondarySidebarVisible,
  });
  const { store } = createMockCommandContext(document);
  services.registerInstance(DocumentStoreServiceId, store);
  const ctx = {
    services,
    events: { emit: vi.fn(), on: () => () => {} },
  };
  return {
    ctx,
    store,
    showForm,
    setActiveContainer,
    setSecondarySidebarVisible,
  };
}

describe('VariablesPlugin commands', () => {
  it('opens create form with create mode', async () => {
    const { ctx, store, showForm } = createCommandContext();
    const command = new CreateVariableCommand();

    showForm.mockResolvedValue({
      action: 'submit',
      values: { key: 'email', sample: 'you@example.com' },
    });

    await command.execute(ctx);

    expect(showForm).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ key: expect.any(String) }),
      })
    );
    expect(store.getDocument().variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'email', sample: 'you@example.com' }),
      ])
    );
  });

  it('opens edit form for an existing variable', async () => {
    const { ctx, store, showForm } = createCommandContext();
    const command = new EditVariableCommand();

    expect(command.canExecute(ctx, { id: 'var-1' })).toBe(true);

    showForm.mockResolvedValue({
      action: 'submit',
      values: { key: 'renamed', sample: 'x' },
    });

    await command.execute(ctx, { id: 'var-1' });

    expect(showForm).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ key: 'name' }),
      })
    );
    expect(store.getDocument().variables[0]).toMatchObject({
      id: 'var-1',
      key: 'renamed',
      sample: 'x',
    });
  });

  it('removes variable when delete extra action is chosen', async () => {
    const { ctx, store, showForm } = createCommandContext();
    const command = new EditVariableCommand();

    showForm.mockResolvedValue({
      action: VARIABLE_FORM_DELETE_ACTION,
      values: { key: 'name', sample: '' },
    });

    await command.execute(ctx, { id: 'var-1' });

    expect(store.getDocument().variables).toHaveLength(0);
  });
});