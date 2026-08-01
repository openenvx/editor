import type { RenderPropValue } from '@xmazu/openenvxee-protocol';
import type { ComponentChild, VNode } from 'preact';

import type { WidgetChild, WidgetNode } from '../types';
import type { HostNode } from './fake-dom';
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
 * Expand a Preact element tree into serializable WidgetNodes.
 * Function components are invoked synchronously (hooks require a mounted host).
 */
export function expandToWidgetTree(
  input: ComponentChild,
  registry: HandlerRegistry | null = null
): WidgetNode | null {
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
      .map((child) => expandToWidgetTree(child as ComponentChild, registry))
      .filter((node): node is WidgetNode => node !== null);
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
    return expandToWidgetTree(result, registry);
  }

  const record = (props ?? {}) as Record<string, unknown>;
  const { children } = record;
  const childNodes: WidgetChild[] = [];
  for (const child of flattenChildren(children)) {
    if (typeof child === 'string' || typeof child === 'number') {
      childNodes.push(child);
      continue;
    }
    const node = expandToWidgetTree(child, registry);
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

/** Recover a WidgetNode tree from a fake-DOM host after Preact render. */
export function hostNodeToWidgetTree(
  node: HostNode,
  registry: HandlerRegistry | null = null
): WidgetNode | null {
  if (node.nodeType === 3) {
    const text = node.textContent;
    if (!text) {
      return null;
    }
    return { type: 'Text', props: {}, children: [text] };
  }

  const kids: WidgetChild[] = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      if (child.textContent) {
        kids.push(child.textContent);
      }
      continue;
    }
    const mapped = hostNodeToWidgetTree(child, registry);
    if (mapped) {
      kids.push(mapped);
    }
  }

  // Skip the synthetic mount root.
  if (node.localName === 'openenvx-root' || node.nodeName === 'openenvx-root') {
    if (kids.length === 1 && typeof kids[0] === 'object') {
      return kids[0];
    }
    if (kids.length === 0) {
      return null;
    }
    return {
      type: 'Stack',
      props: { direction: 'vertical', spacing: 0 },
      children: kids,
    };
  }

  const props = serializeProps({ ...node.__oxProps }, registry);
  delete props.children;
  return {
    type: node.nodeName,
    props,
    children: kids,
  };
}
