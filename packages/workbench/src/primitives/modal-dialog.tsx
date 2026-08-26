import type { HTMLAttributes, ReactNode } from 'react';
import { useEffect } from 'react';

import { usePresence } from '../hooks/use-presence';
import { cn } from '../lib/cn';

import styles from './modal-dialog.module.css';
import overlaySurface from './overlay-surface.module.css';

export interface ModalDialogProps {
  open: boolean;
  title: string;
  titleId?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  /** Extra attributes on the dialog surface (e.g. editor blur-guard markers). */
  dialogProps?: HTMLAttributes<HTMLDivElement>;
}

export function ModalDialog({
  open,
  title,
  titleId,
  onClose,
  children,
  footer,
  contentClassName,
  dialogProps,
}: ModalDialogProps) {
  const { present, state } = usePresence(open);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!present) {
    return null;
  }

  return (
    <div
      className={cn(styles.backdrop, overlaySurface.backdrop)}
      data-state={state}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(styles.dialog, overlaySurface.surface, contentClassName)}
        data-state={state}
        role="dialog"
        {...dialogProps}
      >
        <h3 className={styles.title} id={titleId}>
          {title}
        </h3>
        {children}
        {footer}
      </div>
    </div>
  );
}
