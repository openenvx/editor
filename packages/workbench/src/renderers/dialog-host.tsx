import { editorDiagnosticLog } from '@openenvx/core';
import type { ComponentType } from 'react';
import { useEffect } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';

export interface WorkbenchDialogProps<TPayload = unknown> {
  open: boolean;
  payload: TPayload | null;
  onClose: () => void;
}

export function DialogHost() {
  const { api } = useWorkbenchContext();
  const activeDialog = useWorkbenchContextSelector(
    (state) => state.activeDialog
  );
  const dialogs = useWorkbenchContextSelector((state) => state.dialogs);

  const entry = activeDialog
    ? (dialogs ?? []).find((dialog) => dialog.id === activeDialog.id)
    : undefined;

  useEffect(() => {
    if (!activeDialog || entry) {
      return;
    }
    editorDiagnosticLog(
      'dialog.host',
      'error',
      `No dialog registered for id "${activeDialog.id}"`,
      { id: activeDialog.id },
      `dialog.missing:${activeDialog.id}`
    );
    api.closeDialog(activeDialog.id);
  }, [activeDialog, api, entry]);

  if (!activeDialog || !entry) {
    return null;
  }

  const Component = entry.Component as ComponentType<
    WorkbenchDialogProps<unknown>
  >;
  const payload = (activeDialog.payload ?? null) as unknown;

  return (
    <Component
      onClose={() => api.closeDialog(activeDialog.id)}
      open
      payload={payload}
    />
  );
}
