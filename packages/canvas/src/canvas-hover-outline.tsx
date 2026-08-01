import { createDefaultTransform } from '@openenvx/schema';
import type Konva from 'konva';
import { useEffect, useReducer } from 'react';
import type { RefObject } from 'react';
import { Rect } from 'react-konva';

import type { FlattenedStageLayer } from './flatten-layer-surface';
import { CANVAS_GROUP_LAYER_TYPE } from './layers/canvas-group-layer';
import { computeGroupOutlineBounds } from './scene/group-layers';

const CANVAS_HOVER_OUTLINE_STROKE_WIDTH = 1;

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
    entry.absoluteTransform ??
    entry.layer.transform ??
    createDefaultTransform();

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

export function CanvasHoverOutline({
  artboardGroupRef,
  entry,
  nodeRefs,
  stroke,
}: {
  artboardGroupRef: RefObject<Konva.Group | null>;
  entry: FlattenedStageLayer;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  stroke: string;
}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const stage = artboardGroupRef.current?.getStage();
    if (!stage) {
      return;
    }
    const onMove = () => {
      bump();
    };
    stage.on('dragmove.hoverOutline', onMove);
    stage.on('dragend.hoverOutline', onMove);
    stage.on('transform.hoverOutline', onMove);
    stage.on('transformend.hoverOutline', onMove);
    return () => {
      stage.off('.hoverOutline');
    };
  }, [artboardGroupRef]);

  const artboard = artboardGroupRef.current;
  const node = nodeRefs.current.get(entry.layer.id);
  const rect =
    node && artboard
      ? readLiveHoverOutlineRect(node, artboard)
      : resolveHoverOutlineRect(entry);

  return (
    <Rect
      height={rect.height}
      listening={false}
      rotation={rect.rotation}
      stroke={stroke}
      strokeWidth={CANVAS_HOVER_OUTLINE_STROKE_WIDTH}
      width={rect.width}
      x={rect.x}
      y={rect.y}
    />
  );
}
