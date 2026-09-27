import { nodeTransform } from '@openenvx/studio/schema';
import type Konva from 'konva';

import type { FlattenedStageLayer } from './flatten-layer-surface';
import { CANVAS_GROUP_LAYER_TYPE } from './layers/canvas-group-layer';
import { computeGroupOutlineBounds } from './scene/group-layers';
import { DEFAULT_TRANSFORM } from './stage/default-transform';

export interface HoverOutlineRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Artboard-space rect from scene data. Groups use the same tight child AABB as
 * the dashed group outline (offset by the group origin).
 */
export function resolveHoverOutlineRect(
  entry: FlattenedStageLayer
): HoverOutlineRect {
  const absolute =
    entry.absoluteTransform ?? nodeTransform(entry.layer) ?? DEFAULT_TRANSFORM;

  if (entry.layer.type === CANVAS_GROUP_LAYER_TYPE) {
    const childLayers = (entry.children ?? []).map((child) => child.layer);
    const outline = computeGroupOutlineBounds(absolute, childLayers);
    return {
      height: outline.height,
      rotation: absolute.rotation,
      width: outline.width,
      x: absolute.x + outline.x,
      y: absolute.y + outline.y,
    };
  }

  return {
    height: absolute.height,
    rotation: absolute.rotation,
    width: absolute.width,
    x: absolute.x,
    y: absolute.y,
  };
}

/** Live artboard-space AABB from the Konva node (follows imperative drag). */
export function readLiveHoverOutlineRect(
  node: Konva.Node,
  artboard: Konva.Node
): HoverOutlineRect {
  const rect = node.getClientRect({
    relativeTo: artboard as Konva.Container,
    skipStroke: true,
  });
  return {
    height: Math.max(rect.height, 1),
    rotation: 0,
    width: Math.max(rect.width, 1),
    x: rect.x,
    y: rect.y,
  };
}
