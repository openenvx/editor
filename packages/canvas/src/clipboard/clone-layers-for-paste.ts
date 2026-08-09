import { cloneLayerTree, createLayerId } from '@openenvx/core';
import type { Layer } from '@openenvx/core/schema';
import { createDefaultTransform } from '@openenvx/core/schema';

export { createLayerId };

export function cloneLayers(layers: Layer[]): Layer[] {
  return cloneLayerTree(layers);
}

export interface LayerBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getLayerTransform(layer: Layer) {
  return layer.transform ?? createDefaultTransform();
}

export function getLayersBoundingBox(layers: Layer[]): LayerBoundingBox {
  if (layers.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const layer of layers) {
    const transform = getLayerTransform(layer);
    minX = Math.min(minX, transform.x);
    minY = Math.min(minY, transform.y);
    maxX = Math.max(maxX, transform.x + transform.width);
    maxY = Math.max(maxY, transform.y + transform.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function positionLayersAtAnchor(
  layers: Layer[],
  origin: { x: number; y: number },
  anchor: { x: number; y: number },
  offset?: { x: number; y: number }
): Layer[] {
  const dx = anchor.x - origin.x + (offset?.x ?? 0);
  const dy = anchor.y - origin.y + (offset?.y ?? 0);

  return offsetLayers(layers, dx, dy);
}

export function offsetLayers(layers: Layer[], dx: number, dy: number): Layer[] {
  return layers.map((layer) => {
    const transform = getLayerTransform(layer);
    return {
      ...layer,
      transform: {
        ...transform,
        x: transform.x + dx,
        y: transform.y + dy,
      },
    };
  });
}
