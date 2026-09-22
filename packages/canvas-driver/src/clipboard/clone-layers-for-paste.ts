import { cloneNodeTree, createLayerId } from '@openenvx/studio';
import type { DocumentNode } from '@openenvx/studio/schema';
import { applyNodeTransform, nodeTransform } from '@openenvx/studio/schema';

export { createLayerId };

export function cloneLayers(layers: DocumentNode[]): DocumentNode[] {
  return cloneNodeTree(layers);
}

export interface LayerBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getLayersBoundingBox(layers: DocumentNode[]): LayerBoundingBox {
  if (layers.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const layer of layers) {
    const transform = nodeTransform(layer);
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
  layers: DocumentNode[],
  origin: { x: number; y: number },
  anchor: { x: number; y: number },
  offset?: { x: number; y: number }
): DocumentNode[] {
  const dx = anchor.x - origin.x + (offset?.x ?? 0);
  const dy = anchor.y - origin.y + (offset?.y ?? 0);

  return offsetLayers(layers, dx, dy);
}

export function offsetLayers(
  layers: DocumentNode[],
  dx: number,
  dy: number
): DocumentNode[] {
  return layers.map((layer) => {
    const transform = nodeTransform(layer);
    return applyNodeTransform(layer, {
      ...transform,
      x: transform.x + dx,
      y: transform.y + dy,
    });
  });
}
