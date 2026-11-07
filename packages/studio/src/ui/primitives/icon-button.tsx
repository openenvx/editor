import type { ComponentProps } from 'react';

import { cn } from '../../lib/cn';
import { Button } from './button';

export interface IconButtonProps extends Omit<
  ComponentProps<typeof Button>,
  'size' | 'variant'
> {
  active?: boolean;
  size?: 'default' | 'sm';
}

/** Synara icon button: ghost Button at icon-sm / icon-xs. */
export function IconButton({
  active,
  size = 'default',
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      className={cn('[&_svg]:mx-0', className)}
      data-pressed={active ? '' : undefined}
      size={size === 'sm' ? 'icon-xs' : 'icon-sm'}
      variant="ghost"
      {...props}
    />
  );
}
