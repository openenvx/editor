import { getLayerChildren, isLayerVisible } from '@openenvx/core';
import type { Layer, Page } from '@xmazu/openenvxee-schema';
import {
  createElement,
  Fragment,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { BlockConfig, BlockRenderProps } from '../block-config';
import type { BlockRegistry } from '../block-registry';
import { resolveImageFieldsInData } from '../editor/primary-image-field';

function layerData(layer: Layer): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

export type BlockRenderOverride = (
  props: BlockRenderProps & { layer: Layer }
) => ReactElement;

export interface RenderBlockDocumentOptions {
  /**
   * Per-type render overrides. When present for a layer type, replaces
   * `BlockConfig.render` for that node (slots/children still walk normally
   * unless the override ignores them).
   */
  overrides?: Record<string, BlockRenderOverride>;
  /** Resolve scene asset refs (e.g. `asset:…`) to URLs for image fields. */
  resolveAssetUrl?: (ref: string) => string;
}

function renderSlots(
  data: Record<string, unknown>,
  config: BlockConfig,
  registry: BlockRegistry,
  options: RenderBlockDocumentOptions
): Record<string, ReactNode> {
  const rawSlots = data.slots;
  const result: Record<string, ReactNode> = {};
  if (!(config.slots && rawSlots && typeof rawSlots === 'object')) {
    return result;
  }
  for (const slotKey of Object.keys(config.slots)) {
    const parts = (rawSlots as Record<string, unknown>)[slotKey];
    if (!Array.isArray(parts)) {
      continue;
    }
    result[slotKey] = parts.flatMap((part) => {
      if (!(part && typeof part === 'object')) {
        return [];
      }
      const layer = part as Layer;
      if (!isLayerVisible(layer)) {
        return [];
      }
      const partConfig = registry.get(layer.type);
      if (!partConfig) {
        return [];
      }
      return [renderBlock(layer, partConfig, registry, options)];
    });
  }
  return result;
}

function renderBlock(
  layer: Layer,
  config: BlockConfig,
  registry: BlockRegistry,
  options: RenderBlockDocumentOptions
): ReactElement {
  const resolveAssetUrl = options.resolveAssetUrl ?? ((ref: string) => ref);
  const data = resolveImageFieldsInData(
    layerData(layer),
    resolveAssetUrl,
    config.fields
  );
  const children = config.acceptsChildren
    ? renderBlockTree(getLayerChildren(layer), registry, options)
    : undefined;
  const slots = config.slots
    ? renderSlots(data, config, registry, options)
    : undefined;
  const props: BlockRenderProps = { data, children, slots };
  const override = options.overrides?.[layer.type];
  const element = override
    ? override({ ...props, layer })
    : config.render(props);
  return createElement(Fragment, { key: layer.id }, element);
}

/** Walk layers and produce React nodes via each block's `render`. */
export function renderBlockTree(
  layers: readonly Layer[],
  registry: BlockRegistry,
  options: RenderBlockDocumentOptions = {}
): ReactNode[] {
  return layers.flatMap((layer) => {
    if (!isLayerVisible(layer)) {
      return [];
    }
    const config = registry.get(layer.type);
    if (!config) {
      return [];
    }
    return [renderBlock(layer, config, registry, options)];
  });
}

/**
 * Walk a page's block tree and produce React elements using the same
 * `BlockConfig.render` functions as the live editor pane.
 */
export function renderBlockDocument(
  page: Page,
  registry: BlockRegistry,
  options: RenderBlockDocumentOptions = {}
): ReactElement {
  return createElement(
    Fragment,
    null,
    ...renderBlockTree(page.layers, registry, options)
  );
}
