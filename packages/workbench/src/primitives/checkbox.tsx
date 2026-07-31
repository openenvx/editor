import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

import styles from './checkbox.module.css';

export interface CheckboxProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role'
> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** shadcn-style checkbox — square control with check indicator. */
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
      className={cn(styles.root, checked && styles.checked, className)}
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
      {checked ? (
        <Check
          aria-hidden
          className={styles.indicator}
          size={12}
          strokeWidth={3}
        />
      ) : null}
    </button>
  );
}
