import type {
  RenderChild,
  RenderNode,
  RenderPropValue,
} from '@openenvx/protocol';
import type { ComponentChild, VNode } from 'preact';

import { serializePropValue, type HandlerRegistry } from './handlers';

function isVNode(value: unknown): value is VNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'props' in value
  );
}

function flattenChildren(children: unknown): ComponentChild[] {
  if (
    children === null ||
    children === undefined ||
    typeof children === 'boolean'
  ) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenChildren(child));
  }
  return [children as ComponentChild];
}

function serializeProps(
  record: Record<string, unknown>,
  registry: HandlerRegistry | null
): Record<string, RenderPropValue> {
  const out: Record<string, RenderPropValue> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === 'children' || key === 'key') {
      continue;
    }
    out[key] = serializePropValue(key, value, registry) as RenderPropValue;
  }
  return out;
}

/**
 * Expand a Preact element tree into serializable {@link RenderNode}s.
 * Function components are invoked synchronously.
 */
export function expandToRenderTree(
  input: ComponentChild,
  registry: HandlerRegistry | null = null
): RenderNode | null {
  if (input === null || input === undefined || typeof input === 'boolean') {
    return null;
  }
  if (typeof input === 'string' || typeof input === 'number') {
    return {
      type: 'Text',
      props: {},
      children: [String(input)],
    };
  }
  if (Array.isArray(input)) {
    const kids = input
      .map((child) => expandToRenderTree(child as ComponentChild, registry))
      .filter((node): node is RenderNode => node !== null);
    if (kids.length === 0) {
      return null;
    }
    if (kids.length === 1) {
      return kids[0] ?? null;
    }
    return {
      type: 'Stack',
      props: { direction: 'vertical', spacing: 0 },
      children: kids,
    };
  }
  if (!isVNode(input)) {
    return null;
  }

  const { type, props } = input;
  if (typeof type === 'function') {
    const result = (type as (p: Record<string, unknown>) => ComponentChild)(
      (props ?? {}) as Record<string, unknown>
    );
    return expandToRenderTree(result, registry);
  }

  const record = (props ?? {}) as Record<string, unknown>;
  const { children } = record;
  const childNodes: RenderChild[] = [];
  for (const child of flattenChildren(children)) {
    if (typeof child === 'string' || typeof child === 'number') {
      childNodes.push(child);
      continue;
    }
    const node = expandToRenderTree(child, registry);
    if (node) {
      childNodes.push(node);
    }
  }

  return {
    type: String(type),
    props: serializeProps(record, registry),
    children: childNodes,
  };
}
