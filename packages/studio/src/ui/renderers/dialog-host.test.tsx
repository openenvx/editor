// @vitest-environment jsdom
import type { WorkbenchApi, WorkbenchState } from '@openenvx/studio/core';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { WorkbenchProvider } from '../../context/workbench-context';
import { workbenchI18n } from '../../i18n/workbench-i18n';
import { DialogHost } from './dialog-host';

function renderHost(activeDialog: WorkbenchState['activeDialog']) {
  const closeDialog = vi.fn();
  const state = {
    activeDialog,
    fieldRenderers: [],
    revision: 1,
  } as WorkbenchState;
  const api = {
    closeDialog,
    getSnapshot: () => state,
    patchDialogFormPayload: vi.fn(),
    resolveDialogForm: vi.fn(),
    subscribe: (listener: (next: WorkbenchState) => void) => {
      listener(state);
      return () => {};
    },
  } as WorkbenchApi;

  render(
    <WorkbenchProvider api={api}>
      <I18nextProvider i18n={workbenchI18n}>
        <DialogHost />
      </I18nextProvider>
    </WorkbenchProvider>
  );

  return { closeDialog };
}

describe('DialogHost', () => {
  it('renders confirm dialog content', () => {
    renderHost({
      kind: 'confirm',
      payload: {
        description: 'Cannot undo.',
        title: 'Delete?',
      },
    });

    expect(screen.getByText('Delete?')).toBeTruthy();
    expect(screen.getByText('Cannot undo.')).toBeTruthy();
  });

  it('renders form dialog title', () => {
    renderHost({
      kind: 'form',
      payload: {
        nodes: [],
        title: 'Create variable',
        values: {},
      },
    });

    expect(screen.getByText('Create variable')).toBeTruthy();
  });

  it('renders nothing when no dialog is active', () => {
    const { container } = render(
      <WorkbenchProvider
        api={
          {
            closeDialog: vi.fn(),
            getSnapshot: () =>
              ({ activeDialog: null, fieldRenderers: [], revision: 1 }) as WorkbenchState,
            subscribe: (listener: (next: WorkbenchState) => void) => {
              listener({
                activeDialog: null,
                fieldRenderers: [],
                revision: 1,
              } as WorkbenchState);
              return () => {};
            },
          } as WorkbenchApi
        }
      >
        <DialogHost />
      </WorkbenchProvider>
    );

    expect(container.textContent).toBe('');
  });
});
