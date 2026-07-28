import {
  PLUGIN_ELEMENT_TYPES,
  PLUGIN_FIELD_ELEMENT_TO_KIND,
  PLUGIN_FIELD_KINDS,
  type PluginChild,
  type PluginElementType,
  type PluginNode,
  type PluginPropValue,
} from './types';

export const MAX_PLUGIN_TREE_NODES = 500;
export const MAX_PLUGIN_TREE_JSON_CHARS = 200_000;

const ELEMENT_SET = new Set<string>(PLUGIN_ELEMENT_TYPES);
const FIELD_KIND_SET = new Set<string>(PLUGIN_FIELD_KINDS);

export type PluginTreeValidationResult =
  | { ok: true; root: PluginNode; nodeCount: number }
  | { ok: false; reason: string };

export interface ValidatePluginTreeOptions {
  /**
   * When set, every `bind` must be under `plugin.${externalPanelId}.`.
   * Used for untrusted `panel:tree` payloads.
   */
  externalPanelId?: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPluginPropValue(value: unknown): value is PluginPropValue {
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
    return value.every(isPluginPropValue);
  }
  if (isPlainObject(value)) {
    return Object.values(value).every(isPluginPropValue);
  }
  return false;
}

function validateFieldKindProps(
  type: string,
  props: Record<string, unknown>,
  externalPanelId?: string
): string | null {
  const kind = PLUGIN_FIELD_ELEMENT_TO_KIND[type];
  if (!kind) {
    return null;
  }
  if (!FIELD_KIND_SET.has(kind)) {
    return `Unknown field kind for ${type}`;
  }
  if (props.key !== undefined && typeof props.key !== 'string') {
    return `${type}: key must be a string`;
  }
  if (props.label !== undefined && typeof props.label !== 'string') {
    return `${type}: label must be a string`;
  }
  if (props.bind !== undefined && typeof props.bind !== 'string') {
    return `${type}: bind must be a string`;
  }
  if (
    typeof props.bind === 'string' &&
    externalPanelId &&
    !props.bind.startsWith(`plugin.${externalPanelId}.`)
  ) {
    return `${type}: bind must be under plugin.${externalPanelId}.*`;
  }
  if (kind === 'select' || kind === 'font' || kind === 'align') {
    if (props.options !== undefined && !Array.isArray(props.options)) {
      return `${type}: options must be an array`;
    }
  }
  return null;
}

function countAndValidate(
  node: unknown,
  state: { count: number; reason?: string },
  externalPanelId?: string
): PluginNode | null {
  if (!isPlainObject(node)) {
    state.reason = 'Node must be a plain object';
    return null;
  }
  if (typeof node.type !== 'string' || !ELEMENT_SET.has(node.type)) {
    state.reason =
      typeof node.type === 'string'
        ? `Unknown element type: ${node.type}`
        : 'Missing element type';
    return null;
  }
  state.count += 1;
  if (state.count > MAX_PLUGIN_TREE_NODES) {
    state.reason = 'Tree exceeds node count cap';
    return null;
  }
  if (!isPlainObject(node.props)) {
    state.reason = `${node.type}: props must be a plain object`;
    return null;
  }
  if (!Array.isArray(node.children)) {
    state.reason = `${node.type}: children must be an array`;
    return null;
  }

  for (const [propKey, propValue] of Object.entries(node.props)) {
    if (!isPluginPropValue(propValue)) {
      state.reason = `${node.type}: invalid prop "${propKey}"`;
      return null;
    }
  }

  const fieldReason = validateFieldKindProps(
    node.type,
    node.props,
    externalPanelId
  );
  if (fieldReason) {
    state.reason = fieldReason;
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
    const nested = countAndValidate(child, state, externalPanelId);
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

export function validatePluginTree(
  input: unknown,
  options?: ValidatePluginTreeOptions
): PluginTreeValidationResult {
  let encoded: string;
  try {
    encoded = JSON.stringify(input);
  } catch {
    return { ok: false, reason: 'Tree is not JSON-serializable' };
  }
  if (encoded.length > MAX_PLUGIN_TREE_JSON_CHARS) {
    return { ok: false, reason: 'Tree payload exceeds size cap' };
  }

  const state: { count: number; reason?: string } = { count: 0 };
  const root = countAndValidate(input, state, options?.externalPanelId);
  if (!root) {
    return {
      ok: false,
      reason: state.reason ?? 'Invalid plugin tree',
    };
  }
  return { ok: true, root, nodeCount: state.count };
}
