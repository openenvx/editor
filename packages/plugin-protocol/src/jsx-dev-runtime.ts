import { jsx as jsxImpl } from './jsx-runtime';
import type { PluginNode } from './types';

export { Fragment, jsx, jsxs } from './jsx-runtime';

export function jsxDEV(
  type: Parameters<typeof jsxImpl>[0],
  props: Record<string, unknown>,
  key?: string | number
): PluginNode {
  return jsxImpl(type, props, key);
}
