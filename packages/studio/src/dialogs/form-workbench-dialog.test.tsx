// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import type { WorkbenchState } from '@openenvx/studio/core';

import { WorkbenchProvider } from '../context/workbench-context';
import { workbenchI18n } from '../i18n/workbench-i18n';
import { FormWorkbenchDialog } from './form-workbench-dialog';

function renderForm(
  apiOverrides: Record<string, unknown>,
  payloadOverrides: Record<string, unknown> = {}
) {
  const resolveDialogForm = vi.fn();
  const patchDialogFormPayload = vi.fn();
  const state = {
    activeDialog: {
      kind: 'form',
      payload: {
        nodes: [],
        title: 'Edit',
        values: { key: 'a' },
        ...payloadOverrides,
      },
    },
    fieldRenderers: [],
    revision: 1,
  } as WorkbenchState;
  const api = {
    getSnapshot: () => state,
    patchDialogFormPayload,
    resolveDialogForm,
    subscribe: (listener: (next: WorkbenchState) => void) => {
      listener(state);
      return () => {};
    },
    ...apiOverrides,
  };

  render(
    <WorkbenchProvider api={api as never}>
      <I18nextProvider i18n={workbenchI18n}>
        <FormWorkbenchDialog
          onClose={vi.fn()}
          open
          payload={state.activeDialog.payload as never}
        />
      </I18nextProvider>
    </WorkbenchProvider>
  );

  return { patchDialogFormPayload, resolveDialogForm };
}

describe('FormWorkbenchDialog', () => {
  it('submits draft values', () => {
    const { resolveDialogForm } = renderForm({});

    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(resolveDialogForm).toHaveBeenCalledWith({
      action: 'submit',
      values: { key: 'a' },
    });
  });

  it('shows validation errors from payload', () => {
    renderForm({}, { error: 'Key required' });
    expect(screen.getByText('Key required')).toBeTruthy();
  });

  it('clears validation error when draft changes', () => {
    const { patchDialogFormPayload } = renderForm({}, { error: 'Key required' });
    expect(patchDialogFormPayload).toHaveBeenCalledWith({ error: null });
  });
});
