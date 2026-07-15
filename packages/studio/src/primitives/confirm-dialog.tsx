import { memo } from 'react';

import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { Button } from './button';

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
    if (!open) {
      return null;
    }

    return (
      <div
        className={styles.backdrop}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onCancel();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onCancel();
          }
        }}
        role="presentation"
      >
        <div aria-modal="true" className={styles.dialog} role="dialog">
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <Button onClick={onCancel} size="sm" variant="outline">
              {cancelLabel ?? t('confirm.cancel')}
            </Button>
            <Button onClick={onConfirm} size="sm">
              {confirmLabel ?? t('confirm.confirm')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';
