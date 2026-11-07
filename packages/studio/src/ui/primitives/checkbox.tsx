import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

import styles from './checkbox.module.css';

export interface CheckboxProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role'
> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Synara checkbox box: light border, primary fill, check glyph. */
export function Checkbox({
  checked,
  onChange,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(styles.root, className)}
      data-checked={checked ? '' : undefined}
      data-slot="checkbox"
      disabled={disabled}
      role="checkbox"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) {
          return;
        }
        onChange(!checked);
      }}
      {...props}
    >
      <span className={styles.indicator} data-slot="checkbox-indicator">
        <svg
          aria-hidden
          className={styles.glyph}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </span>
    </button>
  );
}
