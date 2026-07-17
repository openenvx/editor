import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

import styles from './input.module.css';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(styles.root, className)} {...props} />;
}

export function NumberInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(styles.root, styles.number, className)}
      inputMode="decimal"
      {...props}
      type="text"
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(styles.root, styles.textarea, className)}
      {...props}
    />
  );
}

export { Select } from './select';
export type { SelectOption, SelectProps } from './select';
