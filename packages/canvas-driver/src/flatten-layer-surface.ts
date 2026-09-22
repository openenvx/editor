import type { Transform } from '@openenvx/studio/schema';
import { nodeTransform } from '@openenvx/studio/schema';

import type { CanvasStageLayer } from './canvas-stage-types';
import type { CanvasLayerSurfaceItem } from './layer-surface-item';
import { DEFAULT_TRANSFORM } from './stage/default-transform';

export interface FlattenedStageLayer extends CanvasStageLayer {
  absoluteTransform: Transform;
}

function composeTransforms(parent: Transform, child: Transform): Transform {
  return {
    ...child,
    opacity: (parent.opacity ?? 1) * (child.opacity ?? 1),
    rotation: (parent.rotation ?? 0) + (child.rotation ?? 0),
    x: parent.x + child.x,
    y: parent.y + child.y,
  };
}

export function flattenLayerSurface(
  items: CanvasLayerSurfaceItem[]
): CanvasLayerSurfaceItem[] {
  const result: CanvasLayerSurfaceItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children?.length) {
      result.push(...flattenLayerSurface(item.children));
    }
  }
  return result;
}

export function flattenStageLayers(
  layers: CanvasStageLayer[],
  parentTransform?: Transform
): FlattenedStageLayer[] {
  const parent = parentTransform ?? DEFAULT_TRANSFORM;
  const result: FlattenedStageLayer[] = [];
  for (const layer of layers) {
    if (layer.layer.visible === false) {
      continue;
    }
    const layerTransform = nodeTransform(layer.layer);
    const absoluteTransform = composeTransforms(parent, layerTransform);
    result.push({ ...layer, absoluteTransform });
    if (layer.children?.length) {
      result.push(...flattenStageLayers(layer.children, absoluteTransform));
    }
  }
  return result;
}

export function findLayerSurfaceItem(
  items: CanvasLayerSurfaceItem[],
  layerId: string
): CanvasLayerSurfaceItem | undefined {
  for (const item of items) {
    if (item.layer.id === layerId) {
      return item;
    }
    const nested = item.children
      ? findLayerSurfaceItem(item.children, layerId)
      : undefined;
    if (nested) {
      return nested;
    }
  }
  return undefined;
}
