import {
  CANVAS_INSTANCE_LAYER_TYPE,
  getLayerChildren,
  getLayerChildrenForScene,
} from '@openenvx/core';
import type { Layer, Scene, Transform } from '@openenvx/schema';
import { createDefaultTransform } from '@openenvx/schema';

const CANVAS_GROUP_LAYER_TYPE = 'canvas.group';

export interface FlattenedExportLayer {
  layer: Layer;
  transform: Transform;
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

export function flattenLayersForExport(
  layers: Layer[],
  parentTransform?: Transform,
  scene?: Scene
): FlattenedExportLayer[] {
  const parent = parentTransform ?? createDefaultTransform();
  const result: FlattenedExportLayer[] = [];

  for (const layer of layers) {
    if (layer.visible === false) {
      continue;
    }
    const layerTransform = layer.transform ?? createDefaultTransform();
    const absoluteTransform = composeTransforms(parent, layerTransform);
    const children = scene
      ? getLayerChildrenForScene(layer, scene)
      : getLayerChildren(layer);

    if (layer.type === CANVAS_INSTANCE_LAYER_TYPE && children.length === 0) {
      continue;
    }

    if (
      (layer.type === CANVAS_GROUP_LAYER_TYPE ||
        layer.type === CANVAS_INSTANCE_LAYER_TYPE) &&
      children.length > 0
    ) {
      result.push(
        ...flattenLayersForExport(children, absoluteTransform, scene)
      );
      continue;
    }

    if (children.length > 0) {
      result.push(
        ...flattenLayersForExport(children, absoluteTransform, scene)
      );
      continue;
    }

    result.push({ layer, transform: absoluteTransform });
  }

  return result;
}
