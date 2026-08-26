import { Plus } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  Ref,
} from 'react';

import { cn } from '../lib/cn';
import { Button } from './button';

import styles from './property-list.module.css';

export interface PropertyListProps {
  children: ReactNode;
  className?: string;
}

export function PropertyList({ children, className }: PropertyListProps) {
  return <div className={cn(styles.list, className)}>{children}</div>;
}

export interface PropertyListRowProps {
  leading?: ReactNode;
  label?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  dragging?: boolean;
  rowRef?: Ref<HTMLDivElement>;
  rowStyle?: CSSProperties;
  onRowClick?: () => void;
}

export function PropertyListRow({
  leading,
  label,
  actions,
  children,
  className,
  dragging,
  rowRef,
  rowStyle,
  onRowClick,
}: PropertyListRowProps) {
  const hasHeader = leading || label || actions;

  return (
    <div
      className={cn(styles.row, dragging && styles.rowDragging, className)}
      ref={rowRef}
      style={rowStyle}
    >
      {hasHeader ? (
        <div
          className={cn(
            styles.rowHeader,
            !children && styles.rowHeaderNoBody,
            onRowClick && styles.rowHeaderClickable
          )}
          {...(onRowClick
            ? {
                onClick: onRowClick,
                onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowClick();
                  }
                },
                role: 'button' as const,
                tabIndex: 0,
              }
            : {})}
        >
          {leading ? (
            <div
              className={styles.rowLeading}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {leading}
            </div>
          ) : null}
          {label ? (
            typeof label === 'string' ? (
              <span className={styles.rowLabel}>{label}</span>
            ) : (
              <div className={styles.rowLabel}>{label}</div>
            )
          ) : null}
          {actions ? (
            <div
              className={styles.rowActions}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children ? <div className={styles.rowBody}>{children}</div> : null}
    </div>
  );
}

export interface PropertyListAddProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PropertyListAdd({
  children,
  className,
  ...props
}: PropertyListAddProps) {
  return (
    <Button
      className={cn(styles.add, className)}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    >
      <Plus aria-hidden size={12} />
      {children}
    </Button>
  );
}
