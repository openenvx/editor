import type { RenderChild, RenderNode, RenderPropValue } from './types';

export const MAX_RENDER_TREE_NODES = 500;
export const MAX_RENDER_TREE_JSON_CHARS = 200_000;

export type RenderTreeValidationResult =
  | { ok: true; root: RenderNode; nodeCount: number }
  | { ok: false; reason: string };

export interface ValidateRenderTreeOptions {
  /** Allowed `type` strings for this vocabulary (canvas / html / panel). */
  allowedTypes: ReadonlySet<string>;
  maxNodes?: number;
  maxJsonChars?: number;
  /**
   * Extra per-node checks after structural validation.
   * Return an error string, or null when the node is fine.
   */
  validateNode?: (
    node: RenderNode,
    ctx: { path: string; parentType?: string }
  ) => string | null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isRenderPropValue(value: unknown): value is RenderPropValue {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isRenderPropValue);
  }
  if (isPlainObject(value)) {
    return Object.values(value).every(isRenderPropValue);
  }
  return false;
}

function countAndValidate(
  node: unknown,
  state: { count: number; reason?: string },
  options: ValidateRenderTreeOptions,
  path: string,
  parentType?: string
): RenderNode | null {
  if (!isPlainObject(node)) {
    state.reason = path
      ? `Node must be a plain object (at ${path})`
      : 'Node must be a plain object';
    return null;
  }
  if (typeof node.type !== 'string' || !options.allowedTypes.has(node.type)) {
    state.reason =
      typeof node.type === 'string'
        ? `Unknown element type: ${node.type}${path ? ` (at ${path})` : ''}`
        : `Missing element type${path ? ` (at ${path})` : ''}`;
    return null;
  }
  state.count += 1;
  const maxNodes = options.maxNodes ?? MAX_RENDER_TREE_NODES;
  if (state.count > maxNodes) {
    state.reason = 'Tree exceeds node count cap';
    return null;
  }
  if (!isPlainObject(node.props)) {
    state.reason = `${node.type}: props must be a plain object${path ? ` (at ${path})` : ''}`;
    return null;
  }
  if (!Array.isArray(node.children)) {
    state.reason = `${node.type}: children must be an array${path ? ` (at ${path})` : ''}`;
    return null;
  }

  for (const [propKey, propValue] of Object.entries(node.props)) {
    if (!isRenderPropValue(propValue)) {
      state.reason = `${node.type}: invalid prop "${propKey}"${path ? ` (at ${path})` : ''}`;
      return null;
    }
  }

  const children: RenderChild[] = [];
  const nodePath = path ? `${path}/${node.type}` : node.type;
  for (const [index, child] of node.children.entries()) {
    if (child === null || child === undefined || typeof child === 'boolean') {
      continue;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      children.push(child);
      continue;
    }
    const nested = countAndValidate(
      child,
      state,
      options,
      `${nodePath}[${index}]`,
      node.type
    );
    if (!nested) {
      return null;
    }
    children.push(nested);
  }

  const key = node.key;
  const renderNode: RenderNode = {
    type: node.type,
    ...(typeof key === 'string' || typeof key === 'number' ? { key } : {}),
    props: node.props as RenderNode['props'],
    children,
  };

  if (options.validateNode) {
    const extra = options.validateNode(renderNode, { path, parentType });
    if (extra) {
      state.reason = path ? `${extra} (at ${path})` : extra;
      return null;
    }
  }

  return renderNode;
}

/**
 * Vocabulary-parameterized validator for the shared RenderNode envelope
 * (canvas widgets, HTML widgets, and panels).
 */
export function validateRenderTree(
  input: unknown,
  options: ValidateRenderTreeOptions
): RenderTreeValidationResult {
  let encoded: string;
  try {
    encoded = JSON.stringify(input);
  } catch {
    return { ok: false, reason: 'Tree is not JSON-serializable' };
  }
  const maxChars = options.maxJsonChars ?? MAX_RENDER_TREE_JSON_CHARS;
  if (encoded.length > maxChars) {
    return { ok: false, reason: 'Tree payload exceeds size cap' };
  }

  const state: { count: number; reason?: string } = { count: 0 };
  const root = countAndValidate(input, state, options, '');
  if (!root) {
    return {
      ok: false,
      reason: state.reason ?? 'Invalid render tree',
    };
  }
  return { ok: true, root, nodeCount: state.count };
}
