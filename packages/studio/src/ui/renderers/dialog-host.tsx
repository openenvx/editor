import { useWorkbenchContext } from '../../context/workbench-context';
import { useWorkbenchContextSelector } from '../../hooks/use-workbench-selector';
import { ConfirmWorkbenchDialog } from '../dialogs/confirm-workbench-dialog';
import { FormWorkbenchDialog } from '../dialogs/form-workbench-dialog';

export function DialogHost() {
  const { api } = useWorkbenchContext();
  const activeDialog = useWorkbenchContextSelector(
    (state) => state.activeDialog
  );

  if (!activeDialog) {
    return null;
  }

  const onClose = () => {
    api.closeDialog();
  };

  if (activeDialog.kind === 'confirm') {
    return (
      <ConfirmWorkbenchDialog
        onClose={onClose}
        open
        payload={activeDialog.payload}
      />
    );
  }

  return (
    <FormWorkbenchDialog
      onClose={onClose}
      open
      payload={activeDialog.payload}
    />
  );
}
