import { Copy, GripVertical, Trash2 } from 'lucide-react';
import { memo, type HTMLAttributes, type PointerEvent } from 'react';

import styles from './html-editor-pane.module.css';

function stopMenuEvent(event: PointerEvent) {
  event.stopPropagation();
}

export const BlockSelectionMenu = memo(
  ({
    label,
    canDrag = false,
    canDuplicate,
    canRemove,
    dragHandleProps,
    onDuplicate,
    onRemove,
  }: {
    label: string;
    canDrag?: boolean;
    canDuplicate: boolean;
    canRemove: boolean;
    dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
    onDuplicate: () => void;
    onRemove: () => void;
  }) => {
    const showActions = canDrag || canDuplicate || canRemove;
    return (
      <div
        aria-label={`${label} actions`}
        className={styles.selectionMenu}
        role="toolbar"
        onPointerDown={stopMenuEvent}
      >
        {canDrag ? (
          <button
            type="button"
            {...dragHandleProps}
            aria-label="Move"
            className={`${styles.selectionMenuButton} ${styles.selectionMenuDragHandle}`}
          >
            <GripVertical size={14} strokeWidth={1.75} />
          </button>
        ) : null}
        <span className={styles.selectionMenuLabel}>{label}</span>
        {showActions && (canDuplicate || canRemove) ? (
          <span aria-hidden className={styles.selectionMenuDivider} />
        ) : null}
        {canDuplicate ? (
          <button
            aria-label="Duplicate"
            className={styles.selectionMenuButton}
            type="button"
            onClick={onDuplicate}
          >
            <Copy size={14} strokeWidth={1.75} />
          </button>
        ) : null}
        {canRemove ? (
          <button
            aria-label="Delete"
            className={styles.selectionMenuButton}
            type="button"
            onClick={onRemove}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    );
  }
);
