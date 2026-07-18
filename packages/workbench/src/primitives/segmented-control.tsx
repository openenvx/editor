import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

import styles from './segmented-control.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
  variant?: 'inspector';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  fullWidth,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        styles.root,
        styles.inspector,
        fullWidth && styles.fullWidth,
        className
      )}
      role="group"
    >
      {options.map((option) => (
        <button
          aria-label={option.icon ? option.label : undefined}
          className={cn(
            styles.option,
            value === option.value && styles.optionActive,
            option.icon && !option.label ? styles.iconOnly : undefined
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          title={option.label}
          type="button"
        >
          {option.icon}
          {option.icon ? null : option.label}
        </button>
      ))}
    </div>
  );
}
