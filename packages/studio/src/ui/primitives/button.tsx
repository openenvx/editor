import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ButtonHTMLAttributes, ReactElement } from 'react';

import { cn } from '../../lib/cn';

import styles from './button.module.css';

const sizeClass = {
  chip: styles.sizeChip,
  default: styles.sizeDefault,
  icon: styles.sizeIcon,
  'icon-chip': styles.sizeIconChip,
  'icon-lg': styles.sizeIconLg,
  'icon-sm': styles.sizeIconSm,
  'icon-xl': styles.sizeIconXl,
  'icon-xs': styles.sizeIconXs,
  lg: styles.sizeLg,
  sm: styles.sizeSm,
  xl: styles.sizeXl,
  xs: styles.sizeXs,
} as const;

const variantClass = {
  chrome: styles.variantChrome,
  'chrome-outline': styles.variantChromeOutline,
  circle: styles.variantCircle,
  default: styles.variantDefault,
  destructive: styles.variantDestructive,
  'destructive-outline': styles.variantDestructiveOutline,
  ghost: styles.variantGhost,
  link: styles.variantLink,
  outline: styles.variantOutline,
  'primary-outline': styles.variantPrimaryOutline,
  prominent: styles.variantProminent,
  secondary: styles.variantSecondary,
  'secondary-outline': styles.variantSecondaryOutline,
  subtle: styles.variantSubtle,
} as const;

export type ButtonVariant = keyof typeof variantClass;
export type ButtonSize = keyof typeof sizeClass;

/** Class list for `Button` styling on elements that cannot render `Button`. */
export function buttonVariants({
  variant = 'default',
  size = 'default',
  shape = 'default',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: 'default' | 'capsule';
  className?: string;
} = {}): string {
  return cn(
    styles.root,
    shape === 'capsule' && styles.capsule,
    sizeClass[size],
    variantClass[variant],
    className
  );
}

/** Dialog footers and inline error actions share this sizing override. */
export const dialogActionButtonClassName = styles.dialogAction;

export interface ButtonProps extends useRender.ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `capsule` turns any variant into a fully rounded pill. */
  shape?: 'default' | 'capsule';
}

/** Synara button: Base UI `useRender`, so `render` can swap the element. */
export function Button({
  className,
  variant,
  size,
  shape,
  render,
  ...props
}: ButtonProps): ReactElement {
  const type: ButtonHTMLAttributes<HTMLButtonElement>['type'] = render
    ? undefined
    : 'button';
  const defaultProps = {
    className: buttonVariants({ className, shape, size, variant }),
    'data-slot': 'button',
    type,
  };

  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(defaultProps, props),
    render,
  });
}
