import {
  CANVAS_ELEMENT_TYPES,
  HTML_ELEMENT_TYPES,
  type RenderNode,
} from './types';
import { validateRenderTree } from './validate-render-tree';

const CANVAS_TYPES = new Set<string>(CANVAS_ELEMENT_TYPES);
const HTML_TYPES = new Set<string>(HTML_ELEMENT_TYPES);

/** Leaf canvas scene types allowed via the Layer escape hatch. */
export const WIDGET_LAYER_ESCAPE_TYPES = [
  'canvas.rect',
  'canvas.text',
  'canvas.circle',
  'canvas.image',
  'canvas.svg',
  'canvas.qr',
] as const;

/** Leaf HTML scene types allowed via the Block escape hatch. */
export const WIDGET_BLOCK_ESCAPE_TYPES = [
  'html.heading',
  'html.text',
  'html.image',
  'html.button',
  'html.raw',
] as const;

const LAYER_ESCAPE = new Set<string>(WIDGET_LAYER_ESCAPE_TYPES);
const BLOCK_ESCAPE = new Set<string>(WIDGET_BLOCK_ESCAPE_TYPES);

export type WidgetTreeKind = 'canvas' | 'html';

export class WidgetTreeValidationError extends Error {
  readonly path: string;

  constructor(message: string, path = '') {
    super(path ? `${message} (at ${path})` : message);
    this.name = 'WidgetTreeValidationError';
    this.path = path;
  }
}

function opaqueDataKeys(data: unknown): string | null {
  if (data === undefined) {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'data must be a plain object';
  }
  const record = data as Record<string, unknown>;
  for (const key of [
    'children',
    'writeMode',
    'showInLayers',
    'allowedDataKeys',
  ]) {
    if (key in record) {
      return `data.${key} is not allowed on escape hatches`;
    }
  }
  return null;
}

function canvasNodeCheck(node: RenderNode): string | null {
  if (node.type === 'Layer') {
    if (
      typeof node.props.type !== 'string' ||
      !LAYER_ESCAPE.has(node.props.type)
    ) {
      return `Layer type must be one of: ${WIDGET_LAYER_ESCAPE_TYPES.join(', ')}`;
    }
    const dataError = opaqueDataKeys(node.props.data);
    if (dataError) {
      return dataError;
    }
  }
  if (node.type === 'Instance') {
    if (typeof node.props.componentId !== 'string' || !node.props.componentId) {
      return 'Instance requires componentId';
    }
  }
  if (node.type === 'QR') {
    if (typeof node.props.value !== 'string') {
      return 'QR requires value';
    }
  }
  if (node.type === 'SVG') {
    if (typeof node.props.svg !== 'string') {
      return 'SVG requires svg markup';
    }
  }

  for (const child of node.children) {
    if (typeof child === 'string' || typeof child === 'number') {
      if (
        node.type !== 'Text' &&
        node.type !== 'Stack' &&
        node.type !== 'Group' &&
        node.type !== 'Grid'
      ) {
        return `Raw text is not valid inside ${node.type}`;
      }
    }
  }
  return null;
}

function htmlNodeCheck(
  node: RenderNode,
  ctx: { path: string; parentType?: string }
): string | null {
  const { parentType } = ctx;
  if (node.type === 'Column' && parentType && parentType !== 'Row') {
    return 'Column must be a direct child of Row';
  }
  if (parentType === 'Row' && node.type !== 'Column') {
    return 'Row children must be Column elements';
  }
  if (node.type === 'Html' && typeof node.props.markup !== 'string') {
    return 'Html requires markup';
  }
  if (node.type === 'Block') {
    if (
      typeof node.props.type !== 'string' ||
      !BLOCK_ESCAPE.has(node.props.type)
    ) {
      return `Block type must be one of: ${WIDGET_BLOCK_ESCAPE_TYPES.join(', ')}`;
    }
    const dataError = opaqueDataKeys(node.props.data);
    if (dataError) {
      return dataError;
    }
  }

  for (const child of node.children) {
    if (typeof child === 'string' || typeof child === 'number') {
      if (
        node.type !== 'Heading' &&
        node.type !== 'Paragraph' &&
        node.type !== 'Button' &&
        node.type !== 'Column' &&
        node.type !== 'Section'
      ) {
        return `Raw text is not valid inside ${node.type}`;
      }
    }
  }
  return null;
}

/**
 * Validate a widget element tree for the target medium.
 * Throws {@link WidgetTreeValidationError} on structural mistakes.
 */
export function validateWidgetTree(
  root: RenderNode | null,
  kind: WidgetTreeKind
): void {
  if (!root) {
    throw new WidgetTreeValidationError('Widget tree is empty');
  }
  const result = validateRenderTree(root, {
    allowedTypes: kind === 'canvas' ? CANVAS_TYPES : HTML_TYPES,
    validateNode: kind === 'canvas' ? canvasNodeCheck : htmlNodeCheck,
  });
  if (!result.ok) {
    throw new WidgetTreeValidationError(result.reason);
  }
}
