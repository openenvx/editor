import type {
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  Ref,
  CSSProperties,
} from 'react';

import { FloatingToolbar } from './floating-toolbar';
import type { FloatingSelectionToolbarItem } from './floating-toolbar-descriptor';

import styles from './floating-toolbar.module.css';

function stopToolbarEvent(event: ReactPointerEvent) {
  event.stopPropagation();
}

export interface FloatingSelectionToolbarProps {
  items: FloatingSelectionToolbarItem[];
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  onCommand: (commandId: string, args?: Record<string, unknown>) => void;
  onFile: (commandId: string, file: File) => void;
}

export function FloatingSelectionToolbar(props: FloatingSelectionToolbarProps) {
  return <FloatingToolbar {...props} />;
}

export interface FloatingSelectionToolbarShellProps extends FloatingSelectionToolbarProps {
  ariaLabel: string;
  menuRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  theme?: string;
}

/** Portaled selection pill chrome (position supplied by driver). */
export function FloatingSelectionToolbarShell({
  ariaLabel,
  menuRef,
  style,
  theme,
  onPointerDown = stopToolbarEvent,
  ...itemsProps
}: FloatingSelectionToolbarShellProps & {
  onPointerDown?: (event: ReactPointerEvent) => void;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={`${styles.floatingToolbar} ${styles.floatingToolbarTransform}`}
      data-owb-chrome=""
      data-owb-theme={theme}
      onPointerDown={onPointerDown}
      ref={menuRef}
      role="toolbar"
      style={style}
    >
      <FloatingSelectionToolbar {...itemsProps} />
    </div>
  );
}
