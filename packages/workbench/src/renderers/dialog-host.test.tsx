import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkbenchProvider } from '../context/workbench-context';
import { createMockWorkbenchApi } from '../test/mock-workbench-context';
import { DialogHost, type WorkbenchDialogProps } from './dialog-host';

afterEach(cleanup);

function TestDialog({ open, payload, onClose }: WorkbenchDialogProps<{ label: string }>) {
  if (!open || !payload) {
    return null;
  }
  return (
    <div>
      <p>{payload.label}</p>
      <button onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}

describe('DialogHost', () => {
  it('renders the registered dialog component for the active dialog', () => {
    const { api } = createMockWorkbenchApi({
      activeDialog: { id: 'test.dialog', payload: { label: 'Hello dialog' } },
      dialogs: [{ id: 'test.dialog', Component: TestDialog }],
    });

    render(
      <WorkbenchProvider api={api}>
        <DialogHost />
      </WorkbenchProvider>
    );

    expect(screen.getByText('Hello dialog')).toBeTruthy();
  });

  it('renders nothing when no dialog is active', () => {
    const { api } = createMockWorkbenchApi({
      dialogs: [{ id: 'test.dialog', Component: TestDialog }],
    });

    const { container } = render(
      <WorkbenchProvider api={api}>
        <DialogHost />
      </WorkbenchProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('closes via workbench api', () => {
    const closeDialog = vi.fn();
    const { api } = createMockWorkbenchApi({
      activeDialog: { id: 'test.dialog', payload: { label: 'Close me' } },
      dialogs: [{ id: 'test.dialog', Component: TestDialog }],
    });
    api.closeDialog = closeDialog;

    render(
      <WorkbenchProvider api={api}>
        <DialogHost />
      </WorkbenchProvider>
    );

    screen.getByRole('button', { name: 'Close' }).click();
    expect(closeDialog).toHaveBeenCalledWith('test.dialog');
  });

  it('closes when the active dialog id is not registered', async () => {
    const closeDialog = vi.fn();
    const { api } = createMockWorkbenchApi({
      activeDialog: { id: 'missing.dialog', payload: { label: 'Ghost' } },
      dialogs: [{ id: 'test.dialog', Component: TestDialog }],
    });
    api.closeDialog = closeDialog;

    const { container } = render(
      <WorkbenchProvider api={api}>
        <DialogHost />
      </WorkbenchProvider>
    );

    await vi.waitFor(() => {
      expect(closeDialog).toHaveBeenCalledWith('missing.dialog');
    });
    expect(container.firstChild).toBeNull();
  });
});
