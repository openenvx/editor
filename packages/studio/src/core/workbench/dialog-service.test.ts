import { describe, expect, it, vi } from 'vitest';

import { DialogServiceImpl } from './dialog-service';

async function flushAsyncValidation(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('DialogServiceImpl', () => {
  it('opens and closes the active confirm dialog', () => {
    const service = new DialogServiceImpl();
    const listener = vi.fn();
    service.subscribe(listener);

    void service.showConfirm({
      description: 'Cannot undo.',
      title: 'Delete?',
    });
    expect(service.getActive()).toEqual({
      kind: 'confirm',
      payload: { description: 'Cannot undo.', title: 'Delete?' },
    });
    expect(listener).toHaveBeenCalledTimes(1);

    service.close();
    expect(service.getActive()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('replaces the active dialog when opening another confirm', async () => {
    const service = new DialogServiceImpl();

    const first = service.showConfirm({
      description: 'First',
      title: 'First',
    });
    void service.showConfirm({
      description: 'Second',
      title: 'Second',
    });

    await expect(first).resolves.toBe(false);
    expect(service.getActive()).toEqual({
      kind: 'confirm',
      payload: { description: 'Second', title: 'Second' },
    });
  });

  it('resolves showConfirm with true or false', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showConfirm({
      title: 'Delete?',
      description: 'Cannot undo.',
    });
    expect(service.getActive()?.kind).toBe('confirm');

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

  it('rejects a pending confirm when opening a form', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showConfirm({
      title: 'Delete?',
      description: 'Cannot undo.',
    });
    void service.showForm({
      nodes: [],
      title: 'Edit',
      values: {},
    });

    await expect(pending).resolves.toBe(false);
    expect(service.getActive()?.kind).toBe('form');
  });

  it('resolves showForm on submit', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showForm({
      nodes: [],
      title: 'Edit',
      values: { key: 'name' },
    });
    expect(service.getActive()).toEqual({
      kind: 'form',
      payload: {
        nodes: [],
        title: 'Edit',
        values: { key: 'name' },
      },
    });

    service.resolveForm({ action: 'submit', values: { key: 'email' } });
    await expect(pending).resolves.toEqual({
      action: 'submit',
      values: { key: 'email' },
    });
  });

  it('keeps form open when validate returns an error', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showForm({
      nodes: [],
      title: 'Edit',
      validate: (values) =>
        String(values.key ?? '').trim() ? null : 'Invalid key',
      values: { key: '' },
    });

    service.resolveForm({ action: 'submit', values: { key: '' } });
    await flushAsyncValidation();
    const active = service.getActive();
    expect(active?.kind).toBe('form');
    expect(active?.kind === 'form' ? active.payload.error : undefined).toBe(
      'Invalid key'
    );

    service.resolveForm({ action: 'submit', values: { key: 'ok' } });
    await expect(pending).resolves.toEqual({
      action: 'submit',
      values: { key: 'ok' },
    });
  });

  it('resolves extra actions', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showForm({
      extraActions: [{ id: 'delete', label: 'Delete' }],
      nodes: [],
      title: 'Edit',
      values: { key: 'a' },
    });

    service.resolveForm({ action: 'delete', values: { key: 'a' } });
    await expect(pending).resolves.toEqual({
      action: 'delete',
      values: { key: 'a' },
    });
  });

  it('does not run validate for extra actions', async () => {
    const service = new DialogServiceImpl();
    const validate = vi.fn(() => 'blocked');

    const pending = service.showForm({
      extraActions: [{ id: 'delete', label: 'Delete' }],
      nodes: [],
      title: 'Edit',
      validate,
      values: { key: '' },
    });

    service.resolveForm({ action: 'delete', values: { key: '' } });
    await expect(pending).resolves.toEqual({
      action: 'delete',
      values: { key: '' },
    });
    expect(validate).not.toHaveBeenCalled();
  });

  it('resolves showForm with undefined when closed', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showForm({
      nodes: [],
      title: 'Edit',
      values: {},
    });
    service.close();
    await expect(pending).resolves.toBeUndefined();
  });

  it('rejects validate throws with an error message', async () => {
    const service = new DialogServiceImpl();

    const pending = service.showForm({
      nodes: [],
      title: 'Edit',
      validate: () => {
        throw new Error('boom');
      },
      values: {},
    });

    service.resolveForm({ action: 'submit', values: {} });
    await flushAsyncValidation();
    const active = service.getActive();
    expect(active?.kind).toBe('form');
    expect(active?.kind === 'form' ? active.payload.error : undefined).toBe(
      'Validation failed'
    );

    service.close();
    await expect(pending).resolves.toBeUndefined();
  });
});
