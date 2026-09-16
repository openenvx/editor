import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '../lib/cn';

import styles from './button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'chrome';
  size?: 'default' | 'sm' | 'icon';
}

/** Ref-forwarding so Radix `asChild` slots can target the underlying button. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      className={cn(
        styles.root,
        variant === 'ghost' && styles.ghost,
        variant === 'outline' && styles.outline,
        variant === 'chrome' && styles.chrome,
        size === 'sm' && styles.sm,
        size === 'icon' && styles.icon,
        className
      )}
      ref={ref}
      {...props}
      type="button"
    />
  )
);

Button.displayName = 'Button';
