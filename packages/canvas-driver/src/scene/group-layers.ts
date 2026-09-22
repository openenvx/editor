import type { DocumentNode, Transform } from '@openenvx/studio';
import { getLayerChildren } from '@openenvx/studio';
import {
  applyNodeTransform,
  artboardSpaceSize,
  createDefaultTransform,
  nodeTransform,
} from '@openenvx/studio/schema';
import type { Artboard } from '@openenvx/studio/schema';

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

function getLayerTransform(layer: DocumentNode): Transform {
  return nodeTransform(layer);
}

function computeLayerBounds(layer: DocumentNode): LayerBounds {
  const transform = getLayerTransform(layer);
  return {
    x: transform.x,
    y: transform.y,
    width: transform.width,
    height: transform.height,
  };
}

export function computeUnionBounds(layers: DocumentNode[]): LayerBounds {
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
 * side). Pure - does not mutate children or the group origin. Empty group
 * falls back to the stored box.
 */
export function computeGroupOutlineBounds(
  groupTransform: Pick<Transform, 'width' | 'height'>,
  children: DocumentNode[]
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
  layer: DocumentNode,
  groupOrigin: { x: number; y: number }
): DocumentNode {
  const transform = getLayerTransform(layer);
  return applyNodeTransform(layer, {
    ...transform,
    x: transform.x - groupOrigin.x,
    y: transform.y - groupOrigin.y,
  });
}

export function toAbsoluteTransform(
  layer: DocumentNode,
  groupOrigin: { x: number; y: number }
): DocumentNode {
  const transform = getLayerTransform(layer);
  return applyNodeTransform(layer, {
    ...transform,
    x: transform.x + groupOrigin.x,
    y: transform.y + groupOrigin.y,
  });
}

export function createGroupFromLayers(
  groupId: string,
  layers: DocumentNode[],
  artboard: Pick<Artboard, 'space'>
): DocumentNode {
  const bounds = computeUnionBounds(layers);
  const children = layers.map((layer) =>
    toRelativeTransform(layer, { x: bounds.x, y: bounds.y })
  );

  const { width, height } = artboardSpaceSize({
    id: 'page',
    name: 'Page',
    nodes: [],
    space: artboard.space,
  });

  const groupLayer = new CanvasGroupLayer().createDefault(groupId, {
    id: 'page',
    name: 'Page',
    nodes: [],
    space: { width, height },
    extensions: { layout: 'absolute' },
  });

  return {
    ...groupLayer,
    children,
    frame: {
      ...(groupLayer.frame ?? createDefaultTransform()),
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    },
  };
}

export function groupRootLayers(
  rootLayers: DocumentNode[],
  selectedIds: string[],
  groupId: string,
  artboard: Pick<Artboard, 'space'>
): DocumentNode[] {
  const selectedSet = new Set(selectedIds);
  const toGroup = rootLayers.filter((layer) => selectedSet.has(layer.id));
  if (toGroup.length < 2) {
    return rootLayers;
  }

  const group = createGroupFromLayers(groupId, toGroup, artboard);
  const result: DocumentNode[] = [];
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

export function ungroupLayer(
  rootLayers: DocumentNode[],
  groupId: string
): DocumentNode[] {
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
  rootLayers: DocumentNode[],
  selectedIds: string[]
): boolean {
  const rootIds = new Set(rootLayers.map((layer) => layer.id));
  return selectedIds.every((id) => rootIds.has(id));
}

function findRootGroupLayer(
  rootLayers: DocumentNode[],
  layerId: string
): DocumentNode | null {
  const layer = rootLayers.find((entry) => entry.id === layerId);
  if (layer?.type === CANVAS_GROUP_LAYER_TYPE) {
    return layer;
  }
  return null;
}

export function findSelectedRootGroup(
  rootLayers: DocumentNode[],
  selectedIds: string[]
): DocumentNode | null {
  for (const id of selectedIds) {
    const group = findRootGroupLayer(rootLayers, id);
    if (group) {
      return group;
    }
  }
  return null;
}
