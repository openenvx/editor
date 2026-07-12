import { createDefaultTransform } from '@openenvx/schema';
import { Rect } from 'react-konva';

import type { CanvasStageLayer } from './canvas-stage-types';

const CANVAS_HOVER_OUTLINE_STROKE_WIDTH = 1;

export function CanvasHoverOutline({
  entry,
  stroke,
}: {
  entry: CanvasStageLayer;
  stroke: string;
}) {
  const transform = entry.layer.transform ?? createDefaultTransform();

  return (
    <Rect
      height={transform.height}
      listening={false}
      rotation={transform.rotation}
      stroke={stroke}
      strokeWidth={CANVAS_HOVER_OUTLINE_STROKE_WIDTH}
      width={transform.width}
      x={transform.x}
      y={transform.y}
    />
  );
}
