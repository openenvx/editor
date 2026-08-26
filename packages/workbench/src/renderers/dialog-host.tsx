import type { ComponentType } from 'react';

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

  if (!activeDialog) {
    return null;
  }

  const entry = (dialogs ?? []).find((dialog) => dialog.id === activeDialog.id);
  if (!entry) {
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
