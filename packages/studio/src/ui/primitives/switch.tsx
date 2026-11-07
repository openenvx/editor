import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

import styles from './switch.module.css';

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role'
> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Synara switch: accent track, white thumb. */
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
      className={cn(styles.root, className)}
      data-slot="switch"
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
      <span className={styles.thumb} data-slot="switch-thumb" />
    </button>
  );
}
