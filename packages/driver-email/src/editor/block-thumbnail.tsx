import { isLayerVisible } from '@openenvx/core';
import type { BlockConfig, BlockRegistry } from '@openenvx/html';
import type { Layer } from '@openenvx/schema';
import { createElement, Fragment, type ReactNode } from 'react';

function layerData(layer: Layer): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

function renderPart(layer: Layer, registry: BlockRegistry): ReactNode | null {
  if (!isLayerVisible(layer)) {
    return null;
  }
  const config = registry.get(layer.type);
  if (!config) {
    return null;
  }
  return createElement(
    Fragment,
    { key: layer.id },
    config.render({ data: layerData(layer) })
  );
}

function renderDefaultSlots(
  data: Record<string, unknown>,
  config: BlockConfig,
  registry: BlockRegistry
): Record<string, ReactNode> | undefined {
  if (!config.slots) {
    return undefined;
  }
  const rawSlots = data.slots;
  if (!rawSlots || typeof rawSlots !== 'object') {
    return undefined;
  }
  const result: Record<string, ReactNode> = {};
  for (const slotKey of Object.keys(config.slots)) {
    const parts = (rawSlots as Record<string, unknown>)[slotKey];
    if (!Array.isArray(parts)) {
      continue;
    }
    result[slotKey] = parts.flatMap((part) => {
      if (!part || typeof part !== 'object') {
        return [];
      }
      const node = renderPart(part as Layer, registry);
      return node ? [node] : [];
    });
  }
  return result;
}

/** Live thumbnail of a pattern's defaultData using the same BlockConfig.render. */
export function renderPatternThumbnail(
  config: BlockConfig,
  registry: BlockRegistry
): ReactNode {
  const data = structuredClone(config.defaultData);
  const slots = renderDefaultSlots(data, config, registry);
  return config.render({ data, slots });
}
