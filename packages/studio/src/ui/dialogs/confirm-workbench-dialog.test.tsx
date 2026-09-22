// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WorkbenchProvider } from '../../context/workbench-context';
import { ConfirmWorkbenchDialog } from './confirm-workbench-dialog';

describe('ConfirmWorkbenchDialog', () => {
  it('resolves confirm true and closes on cancel', () => {
    const resolveDialogConfirm = vi.fn();
    const onClose = vi.fn();
    const api = { resolveDialogConfirm };

    render(
      <WorkbenchProvider api={api as never}>
        <ConfirmWorkbenchDialog
          onClose={onClose}
          open
          payload={{
            cancelLabel: 'Cancel',
            confirmLabel: 'Confirm',
            description: 'Cannot undo.',
            title: 'Delete?',
          }}
        />
      </WorkbenchProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(resolveDialogConfirm).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
