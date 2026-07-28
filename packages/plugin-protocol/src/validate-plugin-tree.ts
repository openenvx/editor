import {
  PLUGIN_ELEMENT_TYPES,
  type PluginChild,
  type PluginElementType,
  type PluginNode,
} from './types';

export const MAX_PLUGIN_TREE_NODES = 500;
export const MAX_PLUGIN_TREE_JSON_CHARS = 200_000;

const ELEMENT_SET = new Set<string>(PLUGIN_ELEMENT_TYPES);

export type PluginTreeValidationResult =
  | { ok: true; root: PluginNode; nodeCount: number }
  | { ok: false; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function countAndValidate(
  node: unknown,
  state: { count: number }
): PluginNode | null {
  if (!isPlainObject(node)) {
    return null;
  }
  if (typeof node.type !== 'string' || !ELEMENT_SET.has(node.type)) {
    return null;
  }
  state.count += 1;
  if (state.count > MAX_PLUGIN_TREE_NODES) {
    return null;
  }
  if (!isPlainObject(node.props)) {
    return null;
  }
  if (!Array.isArray(node.children)) {
    return null;
  }

  const children: PluginChild[] = [];
  for (const child of node.children) {
    if (child === null || child === undefined || typeof child === 'boolean') {
      continue;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      children.push(child);
      continue;
    }
    const nested = countAndValidate(child, state);
    if (!nested) {
      return null;
    }
    children.push(nested);
  }

  const key = node.key;
  return {
    type: node.type as PluginElementType,
    ...(typeof key === 'string' || typeof key === 'number' ? { key } : {}),
    props: node.props as PluginNode['props'],
    children,
  };
}

export function validatePluginTree(input: unknown): PluginTreeValidationResult {
  let encoded: string;
  try {
    encoded = JSON.stringify(input);
  } catch {
    return { ok: false, reason: 'Tree is not JSON-serializable' };
  }
  if (encoded.length > MAX_PLUGIN_TREE_JSON_CHARS) {
    return { ok: false, reason: 'Tree payload exceeds size cap' };
  }

  const state = { count: 0 };
  const root = countAndValidate(input, state);
  if (!root) {
    if (state.count > MAX_PLUGIN_TREE_NODES) {
      return { ok: false, reason: 'Tree exceeds node count cap' };
    }
    return { ok: false, reason: 'Invalid plugin tree' };
  }
  return { ok: true, root, nodeCount: state.count };
}
