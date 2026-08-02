import type { ReactNode } from 'react';

/** Default child layer for pattern `defaultData.children` (visible in Layers). */
export function createDefaultChild(
  type: string,
  data: Record<string, unknown>
): { id: string; type: string; data: Record<string, unknown> } {
  return {
    id: `${type.replaceAll('.', '-')}-default`,
    type,
    data,
  };
}

export function flattenChildren(children: ReactNode): ReactNode[] {
  if (children === null || children === undefined || children === false) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenChildren(child));
  }
  return [children];
}
