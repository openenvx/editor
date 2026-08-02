import type { ReactNode } from 'react';

/** Flatten nested React children arrays for layout renders. */
export function flattenReactChildren(children: ReactNode): ReactNode[] {
  if (children === null || children === undefined || children === false) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenReactChildren(child));
  }
  return [children];
}
