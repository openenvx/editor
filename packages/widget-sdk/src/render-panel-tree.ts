import type { PluginNode } from '@openenvx/protocol';
import { validatePluginTree } from '@openenvx/protocol';
import type { JSX } from 'preact';

import {
  beginHandlers,
  endHandlers,
  type HandlerRegistry,
  type WidgetHandler,
} from './host/handlers';
import { expandToRenderTree } from './host/walk-tree';

export interface RenderPanelResult {
  tree: PluginNode | null;
  handlers: HandlerRegistry;
}

/**
 * Expand a Preact panel tree to the serializable PluginNode envelope
 * (same {@link RenderNode} shape validators and mappers consume).
 */
export function renderPanelTree(
  element: JSX.Element | null
): RenderPanelResult {
  const handlers: HandlerRegistry = new Map();
  beginHandlers(handlers);
  try {
    if (!element) {
      return { tree: null, handlers };
    }
    const tree = expandToRenderTree(element as never, handlers);
    if (tree) {
      const result = validatePluginTree(tree);
      if (!result.ok) {
        throw new Error(result.reason || 'Invalid panel tree');
      }
      return { tree: result.root, handlers };
    }
    return { tree: null, handlers };
  } finally {
    endHandlers();
  }
}

export type { HandlerRegistry, WidgetHandler };
