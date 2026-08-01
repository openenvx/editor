import { render as preactRender, type ComponentChild } from 'preact';

import { createHostContainer, createHostDocument } from './host/fake-dom';
import {
  beginHandlers,
  endHandlers,
  type HandlerRegistry,
  type WidgetHandler,
} from './host/handlers';
import { expandToWidgetTree, hostNodeToWidgetTree } from './host/walk-tree';
import type { WidgetNode } from './types';

export interface RenderOptions {
  /** Initial / current document props (layer data.values). */
  values?: Record<string, unknown>;
  /**
   * When true, mount via Preact into the fake host so Preact hooks work.
   * Default false: pure synchronous expand.
   */
  mounted?: boolean;
  onValuesChange?: (values: Record<string, unknown>) => void;
  /** Optional outbound handler registry for this render pass. */
  handlers?: HandlerRegistry;
}

type SetPropsGlobal = typeof globalThis & {
  __openenvxSetProps?: (patch: Record<string, unknown>) => void;
  __openenvxWidgetHandlers?: Record<string, WidgetHandler>;
  __openenvxWidgetHandlersByLayer?: Record<
    string,
    Record<string, WidgetHandler>
  >;
};

/**
 * Expand a widget element tree to {@link WidgetNode} JSON.
 * Hosts map this further into scene layers (`applyWidgetFace` / HTML twin).
 */
export function renderToElementTree(
  element: ComponentChild,
  options: RenderOptions = {}
): WidgetNode | null {
  const values = { ...options.values };
  const registry: HandlerRegistry = options.handlers ?? new Map();
  const globalObject = globalThis as SetPropsGlobal;
  const previousSetProps = globalObject.__openenvxSetProps;
  globalObject.__openenvxSetProps = (patch) => {
    Object.assign(values, patch);
    options.onValuesChange?.({ ...values });
  };

  beginHandlers(registry);
  try {
    let tree: WidgetNode | null;
    if (options.mounted) {
      const doc = createHostDocument();
      const container = createHostContainer(doc);
      preactRender(element as never, container as never);
      tree = hostNodeToWidgetTree(container, registry);
    } else {
      tree = expandToWidgetTree(element, registry);
    }

    // Publish handlers for isolate invoke (keyed by id).
    const bag: Record<string, WidgetHandler> = {};
    for (const [id, handler] of registry) {
      bag[id] = handler;
    }
    globalObject.__openenvxWidgetHandlers = bag;
    return tree;
  } finally {
    endHandlers();
    if (previousSetProps) {
      globalObject.__openenvxSetProps = previousSetProps;
    } else {
      delete globalObject.__openenvxSetProps;
    }
  }
}

/**
 * @deprecated Use {@link renderToElementTree}. Kept as a short alias for demos.
 */
export function renderToLayers(
  element: ComponentChild,
  options: RenderOptions = {}
): WidgetNode | null {
  return renderToElementTree(element, options);
}
