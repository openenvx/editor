import { Copy, Trash2 } from 'lucide-react';
import { memo, type PointerEvent } from 'react';

import styles from './html-editor-pane.module.css';

function stopMenuEvent(event: PointerEvent) {
  event.stopPropagation();
}

export const BlockSelectionMenu = memo(
  ({
    label,
    canDuplicate,
    canRemove,
    onDuplicate,
    onRemove,
  }: {
    label: string;
    canDuplicate: boolean;
    canRemove: boolean;
    onDuplicate: () => void;
    onRemove: () => void;
  }) => (
    <div
      aria-label={`${label} actions`}
      className={styles.selectionMenu}
      role="toolbar"
      onPointerDown={stopMenuEvent}
    >
      <span className={styles.selectionMenuLabel}>{label}</span>
      {canDuplicate ? (
        <button
          aria-label="Duplicate"
          className={styles.selectionMenuButton}
          type="button"
          onClick={onDuplicate}
        >
          <Copy size={14} />
        </button>
      ) : null}
      {canRemove ? (
        <button
          aria-label="Delete"
          className={styles.selectionMenuButton}
          type="button"
          onClick={onRemove}
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  )
);
