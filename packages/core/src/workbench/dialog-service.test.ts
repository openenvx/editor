import { describe, expect, it, vi } from 'vitest';

import { WORKBENCH_CONFIRM_DIALOG_ID } from './dialog-registrations';
import { DialogServiceImpl } from './dialog-service';

describe('DialogServiceImpl', () => {
  it('opens and closes the active dialog', () => {
    const service = new DialogServiceImpl();
    const listener = vi.fn();
    service.subscribe(listener);

    service.open('workbench.variables.edit', { mode: 'create' });
    expect(service.getActive()).toEqual({
      id: 'workbench.variables.edit',
      payload: { mode: 'create' },
    });
    expect(listener).toHaveBeenCalledTimes(1);

    service.close();
    expect(service.getActive()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('replaces the active dialog when opening another', () => {
    const service = new DialogServiceImpl();

    service.open('first', { n: 1 });
    service.open('second', { n: 2 });

    expect(service.getActive()).toEqual({ id: 'second', payload: { n: 2 } });
  });

  it('closes only when id matches', () => {
    const service = new DialogServiceImpl();
    service.open('first');

    service.close('other');
    expect(service.getActive()).toEqual({ id: 'first' });

    service.close('first');
    expect(service.getActive()).toBeNull();
  });

  it('resolves showConfirm with true or false', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showConfirm({
      title: 'Delete?',
      description: 'Cannot undo.',
    });
    expect(service.getActive()).toEqual({
      id: WORKBENCH_CONFIRM_DIALOG_ID,
      payload: { title: 'Delete?', description: 'Cannot undo.' },
    });

    service.resolveConfirm(true);
    await expect(pending).resolves.toBe(true);
    expect(service.getActive()).toBeNull();

    const cancelled = service.showConfirm({
      title: 'Delete?',
      description: 'Cannot undo.',
    });
    service.close();
    await expect(cancelled).resolves.toBe(false);
  });

  it('rejects a pending confirm when opening a new confirm', async () => {
    const service = new DialogServiceImpl();

    const first = service.showConfirm({
      title: 'First',
      description: 'First prompt',
    });
    const second = service.showConfirm({
      title: 'Second',
      description: 'Second prompt',
    });

    await expect(first).resolves.toBe(false);
    service.resolveConfirm(true);
    await expect(second).resolves.toBe(true);
    expect(service.getActive()).toBeNull();
  });

  it('rejects a pending confirm when opening another dialog', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showConfirm({
      title: 'Delete?',
      description: 'Cannot undo.',
    });
    service.open('workbench.variables.edit', { mode: 'create' });

    await expect(pending).resolves.toBe(false);
    expect(service.getActive()).toEqual({
      id: 'workbench.variables.edit',
      payload: { mode: 'create' },
    });
  });
});
