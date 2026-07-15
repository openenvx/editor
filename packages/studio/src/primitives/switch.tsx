import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '../lib/cn';

import styles from './switch.module.css';

export interface SwitchProps extends Omit<
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'onChange'
> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({
  checked,
  onChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      className={cn(styles.root, checked && styles.on, className)}
      onCheckedChange={onChange}
      {...props}
    />
  );
}
