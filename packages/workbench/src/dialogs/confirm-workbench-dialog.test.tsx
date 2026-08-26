import { WORKBENCH_CONFIRM_DIALOG_ID } from '@openenvx/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkbenchProvider } from '../context/workbench-context';
import { createMockWorkbenchApi } from '../test/mock-workbench-context';
import { ConfirmWorkbenchDialog } from './confirm-workbench-dialog';

afterEach(cleanup);

describe('ConfirmWorkbenchDialog', () => {
  it('resolves confirm via workbench api', () => {
    const resolveDialogConfirm = vi.fn();
    const { api } = createMockWorkbenchApi({
      activeDialog: {
        id: WORKBENCH_CONFIRM_DIALOG_ID,
        payload: {
          title: 'Delete?',
          description: 'Cannot undo.',
        },
      },
    });
    api.resolveDialogConfirm = resolveDialogConfirm;

    render(
      <WorkbenchProvider api={api}>
        <ConfirmWorkbenchDialog
          onClose={vi.fn()}
          open
          payload={{
            title: 'Delete?',
            description: 'Cannot undo.',
          }}
        />
      </WorkbenchProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(resolveDialogConfirm).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(resolveDialogConfirm).toHaveBeenCalledWith(false);
  });
});
