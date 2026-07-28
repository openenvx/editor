import { Fragment, h } from './h';
import type { PluginNode } from './types';

export { Fragment };

export function jsx(
  type: Parameters<typeof h>[0],
  props: Record<string, unknown>,
  key?: string | number
): PluginNode {
  const next = key === undefined ? props : { ...props, key };
  return h(type, next);
}

export function jsxs(
  type: Parameters<typeof h>[0],
  props: Record<string, unknown>,
  key?: string | number
): PluginNode {
  return jsx(type, props, key);
}

export type { PluginNode as JSXElement };
