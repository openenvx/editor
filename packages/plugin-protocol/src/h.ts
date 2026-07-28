import type {
  PluginChild,
  PluginElement,
  PluginElementType,
  PluginHandler,
  PluginNode,
  PluginPropValue,
} from './types';

export type HandlerRegistry = Map<string, PluginHandler>;

let handlerSeq = 0;
/** ponytail: single active registry — not re-entrant; nested beginRender without endRender corrupts handler ids. */
let activeRegistry: HandlerRegistry | null = null;

/** Begin a render pass; handlers registered via `h()` land in this map. */
export function beginRender(registry: HandlerRegistry): void {
  activeRegistry = registry;
  handlerSeq = 0;
}

export function endRender(): void {
  activeRegistry = null;
}

function isPluginElement(value: unknown): value is PluginElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as PluginElement).__pluginElement === true
  );
}

function serializeProp(
  key: string,
  value: unknown,
  registry: HandlerRegistry | null
): PluginPropValue {
  if (typeof value === 'function') {
    if (!registry) {
      throw new Error(
        `@openenvx/plugin-protocol: handler prop "${key}" used outside beginRender/endRender`
      );
    }
    handlerSeq += 1;
    const id = `h${handlerSeq}`;
    registry.set(id, value as PluginHandler);
    return id;
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      serializeProp(`${key}[${index}]`, item, registry)
    );
  }
  if (typeof value === 'object') {
    const out: Record<string, PluginPropValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'key' || k === 'children') {
        continue;
      }
      out[k] = serializeProp(k, v, registry);
    }
    return out;
  }
  return String(value);
}

function flattenChildren(children: unknown[]): PluginChild[] {
  const out: PluginChild[] = [];
  for (const child of children) {
    if (child === null || child === undefined || typeof child === 'boolean') {
      continue;
    }
    if (Array.isArray(child)) {
      out.push(...flattenChildren(child));
      continue;
    }
    if (
      typeof child === 'object' &&
      child !== null &&
      'type' in child &&
      'props' in child &&
      'children' in child
    ) {
      out.push(child as PluginNode);
      continue;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      out.push(child);
      continue;
    }
  }
  return out;
}

/**
 * Create a serializable plugin tree node.
 * Function props are replaced with handler ids when called inside `beginRender`.
 */
export function h(
  type: PluginElement | PluginElementType,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): PluginNode {
  const elementType: PluginElementType = isPluginElement(type)
    ? type.type
    : type;
  const raw = props ?? {};
  const serialized: Record<string, PluginPropValue> = {};
  let key: string | number | undefined;

  for (const [k, v] of Object.entries(raw)) {
    if (k === 'key') {
      if (typeof v === 'string' || typeof v === 'number') {
        key = v;
      }
      continue;
    }
    if (k === 'children') {
      continue;
    }
    serialized[k] = serializeProp(k, v, activeRegistry);
  }

  const fromProps = raw.children;
  const fromPropsList = Array.isArray(fromProps)
    ? fromProps
    : fromProps !== null && fromProps !== undefined
      ? [fromProps]
      : [];
  const childList = [...fromPropsList, ...children];

  return {
    type: elementType,
    ...(key === undefined ? {} : { key }),
    props: serialized,
    children: flattenChildren(childList),
  };
}

export function Fragment(props: { children?: unknown }): PluginChild[] {
  const { children } = props;
  if (children === null || children === undefined) {
    return [];
  }
  return flattenChildren(Array.isArray(children) ? children : [children]);
}
