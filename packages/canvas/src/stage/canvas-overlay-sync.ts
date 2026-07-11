import Konva from 'konva';
import type { Group } from 'konva/lib/Group';

import type {
  CanvasOverlayPrimitive,
  CanvasOverlayTheme,
} from './canvas-overlay-primitives';

const LABEL_FONT = 'Geist Mono, ui-monospace, monospace';

export function syncCanvasOverlays(
  group: Group,
  primitives: readonly CanvasOverlayPrimitive[],
  theme: CanvasOverlayTheme
): void {
  group.destroyChildren();
  group.listening(false);

  for (const primitive of primitives) {
    if (primitive.kind === 'line') {
      group.add(
        new Konva.Line({
          dash: primitive.dashed ? [6, 4] : undefined,
          listening: false,
          points: primitive.points,
          stroke: theme.guideStroke,
          strokeWidth: primitive.strokeWidth ?? 2,
        })
      );
      continue;
    }

    if (primitive.kind === 'rect') {
      group.add(
        new Konva.Rect({
          dash: primitive.dashed ? [6, 4] : undefined,
          height: primitive.height,
          listening: false,
          stroke: theme.marginStroke,
          strokeWidth: primitive.strokeWidth ?? 1.5,
          width: primitive.width,
          x: primitive.x,
          y: primitive.y,
        })
      );
      continue;
    }

    const label = new Konva.Label({
      listening: false,
      x: primitive.x,
      y: primitive.y,
    });
    label.add(
      new Konva.Tag({
        cornerRadius: 3,
        fill: theme.guideStroke,
        lineJoin: 'round',
        pointerDirection: 'down',
        pointerHeight: 3,
        pointerWidth: 6,
      })
    );
    label.add(
      new Konva.Text({
        fill: theme.foreground,
        fontFamily: LABEL_FONT,
        fontSize: 10,
        padding: 4,
        text: primitive.text,
      })
    );
    group.add(label);
  }

  group.getLayer()?.batchDraw();
}
