import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

import styles from './inspector-field-row.module.css';

export interface InspectorFieldRowProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  /** `switch`: flex h-9 truncate label + trailing control (toggles). Default: 56px grid. */
  variant?: 'default' | 'switch';
}

export function InspectorFieldRow({
  label,
  htmlFor,
  children,
  className,
  variant = 'default',
}: InspectorFieldRowProps) {
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

export interface InspectorFieldBlockProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function InspectorFieldBlock({
  label,
  children,
  className,
}: InspectorFieldBlockProps) {
  return (
    <div className={cn(styles.fieldBlock, className)}>
      <span className={styles.blockLabel}>{label}</span>
      {children}
    </div>
  );
}
