import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

import styles from './switch.module.css';

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role'
> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Compact pill switch — used for inspector toggles and section header enables. */
export function Switch({
  checked,
  onChange,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(styles.root, checked && styles.checked, className)}
      disabled={disabled}
      role="switch"
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
      <span
        className={styles.thumb}
        data-state={checked ? 'checked' : 'unchecked'}
      />
    </button>
  );
}
