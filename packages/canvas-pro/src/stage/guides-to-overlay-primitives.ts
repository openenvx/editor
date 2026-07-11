import type { CanvasOverlayPrimitive } from '@openenvx/canvas';

import type { GuideLine, SpacingGuide } from '../snap/smart-guides/types';

const GUIDE_STROKE_WIDTH = 2;
const CENTER_GUIDE_STROKE_WIDTH = 2;
const SPACING_STROKE_WIDTH = 2;

export function guidesToOverlayPrimitives(
  guides: GuideLine[],
  spacing: SpacingGuide[]
): CanvasOverlayPrimitive[] {
  const primitives: CanvasOverlayPrimitive[] = [];

  for (const guide of guides) {
    const isCenterGuide = guide.fullSpan === true;
    const points =
      guide.orientation === 'v'
        ? [guide.position, guide.extent[0], guide.position, guide.extent[1]]
        : [guide.extent[0], guide.position, guide.extent[1], guide.position];
    primitives.push({
      dashed: !isCenterGuide,
      kind: 'line',
      points,
      strokeWidth: isCenterGuide
        ? CENTER_GUIDE_STROKE_WIDTH
        : GUIDE_STROKE_WIDTH,
    });
  }

  for (const entry of spacing) {
    primitives.push({
      dashed: true,
      kind: 'line',
      points: [
        entry.lineStart.x,
        entry.lineStart.y,
        entry.lineEnd.x,
        entry.lineEnd.y,
      ],
      strokeWidth: SPACING_STROKE_WIDTH,
    });
    primitives.push({
      kind: 'label',
      text: `${entry.gap}`,
      x: entry.labelPosition.x,
      y: entry.labelPosition.y,
    });
  }

  return primitives;
}
