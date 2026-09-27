import type Konva from 'konva';
import { useEffect, useReducer } from 'react';
import type { RefObject } from 'react';
import { Rect } from 'react-konva';

import {
  readLiveHoverOutlineRect,
  resolveHoverOutlineRect,
} from './canvas-hover-outline-geometry';
import type { FlattenedStageLayer } from './flatten-layer-surface';

const CANVAS_HOVER_OUTLINE_STROKE_WIDTH = 1;

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
