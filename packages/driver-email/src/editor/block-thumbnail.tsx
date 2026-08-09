import { isLayerVisible } from '@openenvx/core';
import type { Layer } from '@openenvx/core/schema';
import type { BlockConfig, BlockRegistry } from '@openenvx/html';
import { createElement, Fragment, type ReactNode } from 'react';

function layerData(layer: Layer): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

function asLayers(value: unknown): Layer[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (part): part is Layer =>
      !!part &&
      typeof part === 'object' &&
      typeof (part as Layer).id === 'string' &&
      typeof (part as Layer).type === 'string'
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
    result[slotKey] = asLayers(parts).flatMap((part) => {
      const node = renderLayerThumbnail(part, registry);
      return node ? [node] : [];
    });
  }
  return result;
}

function renderLayerThumbnail(
  layer: Layer,
  registry: BlockRegistry
): ReactNode | null {
  if (!isLayerVisible(layer)) {
    return null;
  }
  const config = registry.get(layer.type);
  if (!config) {
    return null;
  }
  const data = layerData(layer);
  const childNodes = asLayers(data.children)
    .map((child) => renderLayerThumbnail(child, registry))
    .filter((node): node is ReactNode => node !== null && node !== undefined);
  const slots = renderDefaultSlots(data, config, registry);
  return createElement(
    Fragment,
    { key: layer.id },
    config.render({
      data,
      children: childNodes.length > 0 ? childNodes : undefined,
      slots,
    })
  );
}

/** Live thumbnail of a pattern's defaultData using the same BlockConfig.render. */
export function renderPatternThumbnail(
  config: BlockConfig,
  registry: BlockRegistry
): ReactNode {
  const data = structuredClone(config.defaultData);
  const childNodes = asLayers(data.children)
    .map((child) => renderLayerThumbnail(child, registry))
    .filter((node): node is ReactNode => node !== null && node !== undefined);
  const slots = renderDefaultSlots(data, config, registry);
  return config.render({
    data,
    children: childNodes.length > 0 ? childNodes : undefined,
    slots,
  });
}
