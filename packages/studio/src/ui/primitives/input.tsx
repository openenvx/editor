import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

import styles from './input.module.css';

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  size?: 'sm' | 'default';
}

/** Synara input: bordered control wrapping a borderless field. */
export function Input({ className, size = 'default', ...props }: InputProps) {
  return (
    <span
      className={cn(styles.control, size === 'sm' && styles.controlSm)}
      data-slot="input-control"
    >
      <input
        className={cn(styles.root, size === 'sm' && styles.rootSm, className)}
        data-slot="input"
        {...props}
      />
    </span>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <span className={styles.control} data-slot="textarea-control">
      <textarea
        className={cn(styles.root, styles.textarea, className)}
        data-slot="textarea"
        {...props}
      />
    </span>
  );
}

export { Select } from './select';
export type { SelectOption, SelectProps } from './select';
