import { memo } from 'react';

import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { Button } from './button';
import { ModalDialog } from './modal-dialog';

import styles from './confirm-dialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(
  ({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }: ConfirmDialogProps) => {
    const { t } = useWorkbenchTranslation();

    return (
      <ModalDialog
        contentClassName={styles.dialog}
        onClose={onCancel}
        open={open}
        title={title}
      >
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Button onClick={onCancel} size="sm" variant="outline">
            {cancelLabel ?? t('confirm.cancel')}
          </Button>
          <Button onClick={onConfirm} size="sm">
            {confirmLabel ?? t('confirm.confirm')}
          </Button>
        </div>
      </ModalDialog>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';
