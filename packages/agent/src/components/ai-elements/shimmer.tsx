import { memo, type ElementType, type HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

import styles from './shimmer.module.css';

export type ShimmerProps = HTMLAttributes<HTMLElement> & {
  children: string;
  as?: ElementType;
  duration?: number;
};

export const Shimmer = memo(
  ({
    children,
    as: Component = 'span',
    className,
    duration = 2,
    style,
    ...props
  }: ShimmerProps) => (
    <Component
      className={cn(styles.shimmer, className)}
      style={{
        ...style,
        animationDuration: `${duration}s`,
      }}
      {...props}
    >
      {children}
    </Component>
  )
);

Shimmer.displayName = 'Shimmer';
