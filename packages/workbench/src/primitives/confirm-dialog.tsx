import { memo } from 'react';

import { usePresence } from '../hooks/use-presence';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';
import { Button } from './button';

import styles from './confirm-dialog.module.css';
import overlaySurface from './overlay-surface.module.css';

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
    const { present, state } = usePresence(open);

    if (!present) {
      return null;
    }

    return (
      <div
        className={cn(styles.backdrop, overlaySurface.backdrop)}
        data-state={state}
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
        <div
          aria-modal="true"
          className={cn(styles.dialog, overlaySurface.surface)}
          data-state={state}
          role="dialog"
        >
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
