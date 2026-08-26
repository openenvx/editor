import { Plus } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  CSSProperties,
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
          className={cn(styles.rowHeader, !children && styles.rowHeaderNoBody)}
        >
          {leading}
          {label ? (
            typeof label === 'string' ? (
              <span className={styles.rowLabel}>{label}</span>
            ) : (
              <div className={styles.rowLabel}>{label}</div>
            )
          ) : null}
          {actions ? <div className={styles.rowActions}>{actions}</div> : null}
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
