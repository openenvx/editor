import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

import styles from './property-field-row.module.css';

export interface PropertyFieldRowProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  /** `switch`: flex h-9 truncate label + trailing control (toggles). Default: 56px grid. */
  variant?: 'default' | 'switch';
}

export function PropertyFieldRow({
  label,
  htmlFor,
  children,
  className,
  variant = 'default',
}: PropertyFieldRowProps) {
  return (
    <div
      className={cn(
        styles.fieldRow,
        variant === 'switch' && styles.fieldRowSwitch,
        className
      )}
    >
      {htmlFor ? (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
      <div className={styles.control}>{children}</div>
    </div>
  );
}

export interface PropertyFieldBlockProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function PropertyFieldBlock({
  label,
  children,
  className,
}: PropertyFieldBlockProps) {
  return (
    <div className={cn(styles.fieldBlock, className)}>
      <span className={styles.blockLabel}>{label}</span>
      {children}
    </div>
  );
}
