import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { Rect } from 'react-konva';

import type { FlattenedStageLayer } from './flatten-layer-surface';

const CANVAS_HOVER_OUTLINE_STROKE_WIDTH = 1;

export function CanvasHoverOutline({
  entry,
  stroke,
}: {
  entry: FlattenedStageLayer;
  stroke: string;
}) {
  // Hover outline is painted at artboard root — must use composed (absolute)
  // transform, not the layer-local one (nested face children would otherwise
  // draw offset by their parent widget/group origin).
  const transform =
    entry.absoluteTransform ??
    entry.layer.transform ??
    createDefaultTransform();

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
