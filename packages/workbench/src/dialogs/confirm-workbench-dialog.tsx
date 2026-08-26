import type { ConfirmDialogOptions } from '@openenvx/core';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { Button } from '../primitives/button';
import { ModalDialog } from '../primitives/modal-dialog';
import type { WorkbenchDialogProps } from '../renderers/dialog-host';

import styles from '../primitives/confirm-dialog.module.css';

export function ConfirmWorkbenchDialog({
  open,
  payload,
}: WorkbenchDialogProps<ConfirmDialogOptions>) {
  const { api } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();

  if (!payload) {
    return null;
  }

  const handleCancel = () => {
    api.resolveDialogConfirm(false);
  };

  const handleConfirm = () => {
    api.resolveDialogConfirm(true);
  };

  return (
    <ModalDialog
      contentClassName={styles.dialog}
      onClose={handleCancel}
      open={open}
      title={payload.title}
    >
      <p className={styles.description}>{payload.description}</p>
      <div className={styles.actions}>
        <Button onClick={handleCancel} size="sm" variant="outline">
          {payload.cancelLabel ?? t('confirm.cancel')}
        </Button>
        <Button onClick={handleConfirm} size="sm">
          {payload.confirmLabel ?? t('confirm.confirm')}
        </Button>
      </div>
    </ModalDialog>
  );
}
