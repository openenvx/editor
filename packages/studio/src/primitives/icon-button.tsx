import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '../lib/cn';

import styles from './icon-button.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: 'default' | 'sm';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, active, size = 'default', type = 'button', ...props }, ref) => (
    <button
      className={cn(
        styles.root,
        size === 'sm' && styles.sm,
        active && styles.active,
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
