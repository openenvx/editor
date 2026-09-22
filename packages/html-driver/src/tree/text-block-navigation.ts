import { canEditLayerData, getLayerChildren } from '@openenvx/studio';
import type { Layer } from '@openenvx/studio/schema';

import type { BlockRegistry } from '../block-registry';

export function isRichTextBlock(
  registry: BlockRegistry,
  type: string
): boolean {
  return registry.get(type)?.fields.html?.kind === 'richText';
}

function flattenLayers(layers: Layer[], out: Layer[]): void {
  for (const layer of layers) {
    out.push(layer);
    flattenLayers(getLayerChildren(layer), out);
  }
}

/** Next/previous editable rich-text block in document order. */
export function findAdjacentTextBlockId(
  layers: Layer[],
  registry: BlockRegistry,
  fromId: string,
  direction: 'prev' | 'next'
): string | null {
  const order: Layer[] = [];
  flattenLayers(layers, order);
  const textBlocks = order.filter(
    (layer) => isRichTextBlock(registry, layer.type) && canEditLayerData(layer)
  );
  const index = textBlocks.findIndex((layer) => layer.id === fromId);
  if (index === -1) {
    return null;
  }
  const neighbour =
    direction === 'prev' ? textBlocks[index - 1] : textBlocks[index + 1];
  return neighbour?.id ?? null;
}
