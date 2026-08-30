/** Serializable prop values after function → handler-id replacement. */
export type SerializedPropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializedPropValue[]
  | { [key: string]: SerializedPropValue };

export type WidgetHandler = (payload?: unknown) => void | Promise<void>;

export type HandlerRegistry = Map<string, WidgetHandler>;

let handlerSeq = 0;
/** ponytail: single active registry - not re-entrant across nested begin/end. */
let activeRegistry: HandlerRegistry | null = null;

/** Begin a render pass; `on*` function props land in this map as handler ids. */
export function beginHandlers(registry: HandlerRegistry): void {
  activeRegistry = registry;
  handlerSeq = 0;
}

export function endHandlers(): void {
  activeRegistry = null;
}

export function getActiveHandlerRegistry(): HandlerRegistry | null {
  return activeRegistry;
}

/**
 * Replace function props with handler ids when called inside beginHandlers.
 * Lifted from the former plugin-protocol `h()` serializeProp.
 */
export function serializePropValue(
  key: string,
  value: unknown,
  registry: HandlerRegistry | null = activeRegistry
): SerializedPropValue {
  if (typeof value === 'function') {
    if (!registry) {
      // Drop handlers outside a render pass rather than throw - pure expand
      // used in tests may not register a registry.
      return undefined;
    }
    if (!key.startsWith('on')) {
      return undefined;
    }
    handlerSeq += 1;
    const id = `h${handlerSeq}`;
    registry.set(id, value as WidgetHandler);
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
      serializePropValue(`${key}[${index}]`, item, registry)
    );
  }
  if (typeof value === 'object') {
    const out: Record<string, SerializedPropValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'key' || k === 'children') {
        continue;
      }
      out[k] = serializePropValue(k, v, registry);
    }
    return out;
  }
  return String(value);
}

/** Map of child layer id → event name → handler id, persisted on the widget. */
export type WidgetHandlerMap = Record<string, Record<string, string>>;

/**
 * Collect handler ids from a render tree into a flat map keyed by a path
 * prefix (the face mapper remaps paths to child layer ids).
 */
export function collectHandlerProps(
  node: { type: string; props: Record<string, unknown>; children: unknown[] },
  path: string,
  out: WidgetHandlerMap = {}
): WidgetHandlerMap {
  const handlers: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.props)) {
    if (
      key.startsWith('on') &&
      typeof value === 'string' &&
      /^h\d+$/.test(value)
    ) {
      const event = key.slice(2).toLowerCase();
      handlers[event] = value;
    }
  }
  if (Object.keys(handlers).length > 0) {
    out[path] = handlers;
  }
  node.children.forEach((child, index) => {
    if (
      child &&
      typeof child === 'object' &&
      'type' in child &&
      'props' in child &&
      'children' in child
    ) {
      collectHandlerProps(
        child as {
          type: string;
          props: Record<string, unknown>;
          children: unknown[];
        },
        `${path}/${index}`,
        out
      );
    }
  });
  return out;
}
