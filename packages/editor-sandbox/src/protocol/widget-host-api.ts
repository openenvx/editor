import type { RenderNode } from './types';

/**
 * Return shape from `openenvx.widget.register` → `render(values)`.
 * Handlers stay isolate-local (functions); the host stores them per layerId.
 */
export interface WidgetFaceRenderResult {
  tree: RenderNode | null;
  handlers: Record<string, unknown>;
}

/** Entry published by `openenvx.widget.register` / `define*Component`. */
export interface WidgetRegistryEntry {
  id: string;
  manifest?: unknown;
  render: (values: Record<string, unknown>) => WidgetFaceRenderResult;
}
