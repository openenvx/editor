import type { ComponentChild } from 'preact';

import {
  beginHandlers,
  endHandlers,
  type HandlerRegistry,
} from './host/handlers';
import { beginValuesPass, endValuesPass } from './host/values-pass';
import { expandToRenderTree } from './host/walk-tree';
import type { RenderNode } from './protocol';

export interface RenderOptions {
  /** Initial / current document props (layer data.values). */
  values?: Record<string, unknown>;
  onValuesChange?: (values: Record<string, unknown>) => void;
  /** Optional outbound handler registry for this render pass. */
  handlers?: HandlerRegistry;
}

/**
 * Expand a widget element tree to {@link RenderNode} JSON.
 * Hosts map this further into scene layers (`applyWidgetFace` / HTML twin).
 *
 * No isolate globals - values write-back uses an optional values-pass
 * (Node/tests) or host-installed `openenvx.widget.applyProps` (QuickJS).
 */
export function renderToElementTree(
  element: ComponentChild,
  options: RenderOptions = {}
): RenderNode | null {
  const registry: HandlerRegistry = options.handlers ?? new Map();
  const startedValues = beginValuesPass(options.values, options.onValuesChange);
  beginHandlers(registry);
  try {
    return expandToRenderTree(element, registry);
  } finally {
    endHandlers();
    if (startedValues) {
      endValuesPass();
    }
  }
}
