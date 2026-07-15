import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

import styles from './button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'chrome';
  size?: 'default' | 'sm' | 'icon';
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
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
      {...props}
      type="button"
    />
  );
}
