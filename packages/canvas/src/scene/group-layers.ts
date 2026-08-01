import type { Layer, Transform } from '@openenvx/core';
import { getLayerChildren } from '@openenvx/core';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';

import {
  CANVAS_GROUP_LAYER_TYPE,
  CanvasGroupLayer,
} from '../layers/canvas-group-layer';

export interface LayerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getLayerTransform(layer: Layer): Transform {
  return layer.transform ?? createDefaultTransform();
}

function computeLayerBounds(layer: Layer): LayerBounds {
  const transform = getLayerTransform(layer);
  return {
    x: transform.x,
    y: transform.y,
    width: transform.width,
    height: transform.height,
  };
}

export function computeUnionBounds(layers: Layer[]): LayerBounds {
  if (layers.length === 0) {
    return { x: 0, y: 0, width: 200, height: 200 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const layer of layers) {
    const bounds = computeLayerBounds(layer);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

/**
 * Local-space group outline: tight AABB of children (farthest point on each
 * side). Pure — does not mutate children or the group origin. Empty group
 * falls back to the stored box.
 */
export function computeGroupOutlineBounds(
  groupTransform: Pick<Transform, 'width' | 'height'>,
  children: Layer[]
): LayerBounds {
  if (children.length === 0) {
    return {
      x: 0,
      y: 0,
      width: Math.max(groupTransform.width, 1),
      height: Math.max(groupTransform.height, 1),
    };
  }
  return computeUnionBounds(children);
}

export function toRelativeTransform(
  layer: Layer,
  groupOrigin: { x: number; y: number }
): Layer {
  const transform = getLayerTransform(layer);
  return {
    ...layer,
    transform: {
      ...transform,
      x: transform.x - groupOrigin.x,
      y: transform.y - groupOrigin.y,
    },
  };
}

export function toAbsoluteTransform(
  layer: Layer,
  groupOrigin: { x: number; y: number }
): Layer {
  const transform = getLayerTransform(layer);
  return {
    ...layer,
    transform: {
      ...transform,
      x: transform.x + groupOrigin.x,
      y: transform.y + groupOrigin.y,
    },
  };
}

export function createGroupFromLayers(
  groupId: string,
  layers: Layer[],
  page: { width?: number; height?: number }
): Layer {
  const bounds = computeUnionBounds(layers);
  const children = layers.map((layer) =>
    toRelativeTransform(layer, { x: bounds.x, y: bounds.y })
  );

  const groupLayer = new CanvasGroupLayer().createDefault(groupId, {
    id: 'page',
    layers: [],
    name: 'Page',
    layout: 'absolute',
    width: page.width,
    height: page.height,
  });

  return {
    ...groupLayer,
    data: { children },
    transform: {
      ...(groupLayer.transform ?? createDefaultTransform()),
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    },
  };
}

export function groupRootLayers(
  rootLayers: Layer[],
  selectedIds: string[],
  groupId: string,
  page: { width?: number; height?: number }
): Layer[] {
  const selectedSet = new Set(selectedIds);
  const toGroup = rootLayers.filter((layer) => selectedSet.has(layer.id));
  if (toGroup.length < 2) {
    return rootLayers;
  }

  const group = createGroupFromLayers(groupId, toGroup, page);
  const result: Layer[] = [];
  let groupInserted = false;
  for (const layer of rootLayers) {
    if (selectedSet.has(layer.id)) {
      if (!groupInserted) {
        result.push(group);
        groupInserted = true;
      }
      continue;
    }
    result.push(layer);
  }
  return result;
}

export function ungroupLayer(rootLayers: Layer[], groupId: string): Layer[] {
  const group = rootLayers.find((layer) => layer.id === groupId);
  if (!group || group.type !== CANVAS_GROUP_LAYER_TYPE) {
    return rootLayers;
  }

  const groupTransform = getLayerTransform(group);
  const groupOrigin = { x: groupTransform.x, y: groupTransform.y };
  const children = getLayerChildren(group).map((child) =>
    toAbsoluteTransform(child, groupOrigin)
  );

  return rootLayers.flatMap((layer) =>
    layer.id === groupId ? children : [layer]
  );
}

export function isRootLevelSelection(
  rootLayers: Layer[],
  selectedIds: string[]
): boolean {
  const rootIds = new Set(rootLayers.map((layer) => layer.id));
  return selectedIds.every((id) => rootIds.has(id));
}

function findRootGroupLayer(
  rootLayers: Layer[],
  layerId: string
): Layer | null {
  const layer = rootLayers.find((entry) => entry.id === layerId);
  if (layer?.type === CANVAS_GROUP_LAYER_TYPE) {
    return layer;
  }
  return null;
}

export function findSelectedRootGroup(
  rootLayers: Layer[],
  selectedIds: string[]
): Layer | null {
  for (const id of selectedIds) {
    const group = findRootGroupLayer(rootLayers, id);
    if (group) {
      return group;
    }
  }
  return null;
}
