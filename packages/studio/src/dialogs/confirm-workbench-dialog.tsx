import type { ConfirmDialogOptions } from '@openenvx/studio/core';
import { useId } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { Button } from '../primitives/button';
import { ModalDialog } from '../primitives/modal-dialog';

import styles from '../primitives/confirm-dialog.module.css';

export interface ConfirmWorkbenchDialogProps {
  open: boolean;
  payload: ConfirmDialogOptions;
  onClose: () => void;
}

export function ConfirmWorkbenchDialog({
  open,
  payload,
  onClose,
}: ConfirmWorkbenchDialogProps) {
  const { api } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const titleId = useId();

  const handleConfirm = () => {
    api.resolveDialogConfirm(true);
  };

  return (
    <ModalDialog
      contentClassName={styles.dialog}
      onClose={onClose}
      open={open}
      title={payload.title}
      titleId={titleId}
    >
      <p className={styles.description}>{payload.description}</p>
      <div className={styles.actions}>
        <Button onClick={onClose} size="sm" variant="outline">
          {payload.cancelLabel ?? t('confirm.cancel')}
        </Button>
        <Button onClick={handleConfirm} size="sm">
          {payload.confirmLabel ?? t('confirm.confirm')}
        </Button>
      </div>
    </ModalDialog>
  );
}
