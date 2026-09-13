import {
  PLUGIN_ELEMENT_TYPES,
  PLUGIN_FIELD_ELEMENT_TO_KIND,
  PLUGIN_FIELD_KINDS,
  type PluginElementType,
  type PluginNode,
  type RenderNode,
} from './types';
import {
  MAX_RENDER_TREE_JSON_CHARS,
  MAX_RENDER_TREE_NODES,
  validateRenderTree,
  type RenderTreeValidationResult,
} from './validate-render-tree';

export const MAX_PLUGIN_TREE_NODES = MAX_RENDER_TREE_NODES;
export const MAX_PLUGIN_TREE_JSON_CHARS = MAX_RENDER_TREE_JSON_CHARS;

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
  if (
    kind === 'select' ||
    kind === 'segmented' ||
    kind === 'font' ||
    kind === 'align'
  ) {
    if (props.options !== undefined && !Array.isArray(props.options)) {
      return `${type}: options must be an array`;
    }
  }
  return null;
}

export function validatePluginTree(
  input: unknown,
  options?: ValidatePluginTreeOptions
): PluginTreeValidationResult {
  const result: RenderTreeValidationResult = validateRenderTree(input, {
    allowedTypes: ELEMENT_SET,
    validateNode: (node: RenderNode) =>
      validateFieldKindProps(node.type, node.props, options?.externalPanelId),
  });
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    root: result.root as PluginNode & { type: PluginElementType },
    nodeCount: result.nodeCount,
  };
}
