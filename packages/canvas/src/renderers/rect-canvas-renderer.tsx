import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { memo } from 'react';
import { Group, Rect } from 'react-konva';

import type { CanvasLayerRendererHostProps } from '../contributions/canvas-layer-renderer-contribution';
import {
  cornerRadiusToKonva,
  normalizeCornerRadius,
  normalizePadding,
} from '../style-utils';

type RectView = Extract<LayerPreviewDescriptor, { kind: 'rect' }>;

function parseShadowOpacity(color: string): number {
  if (color.length === 9 && color.startsWith('#')) {
    const alpha = Number.parseInt(color.slice(7, 9), 16) / 255;
    return Number.isNaN(alpha) ? 1 : alpha;
  }
  return 1;
}

function parseShadowColor(color: string): string {
  if (color.length === 9 && color.startsWith('#')) {
    return color.slice(0, 7);
  }
  return color;
}

export const RectCanvasRenderer = memo(
  ({ view, width, height, hidden = false }: CanvasLayerRendererHostProps) => {
    const descriptor = view as RectView;

    if (hidden) {
      return <Rect fill="transparent" height={height} width={width} />;
    }

    const padding = normalizePadding(descriptor.padding);
    const cornerRadius = cornerRadiusToKonva(
      normalizeCornerRadius(descriptor.cornerRadius)
    );
    const flipH = descriptor.flipH ?? false;
    const flipV = descriptor.flipV ?? false;
    const shadow = descriptor.shadow;
    const innerWidth = Math.max(0, width - padding.left - padding.right);
    const innerHeight = Math.max(0, height - padding.top - padding.bottom);

    return (
      <Group
        offsetX={flipH ? width : 0}
        offsetY={flipV ? height : 0}
        scaleX={flipH ? -1 : 1}
        scaleY={flipV ? -1 : 1}
      >
        <Rect
          cornerRadius={cornerRadius}
          fill="transparent"
          height={height}
          shadowBlur={
            shadow ? Math.max(0, shadow.blur + (shadow.spread ?? 0)) : 0
          }
          shadowColor={shadow ? parseShadowColor(shadow.color) : undefined}
          shadowOffset={
            shadow ? { x: shadow.offsetX, y: shadow.offsetY } : undefined
          }
          shadowOpacity={shadow ? parseShadowOpacity(shadow.color) : undefined}
          stroke={descriptor.stroke}
          strokeWidth={descriptor.strokeWidth ?? 0}
          width={width}
        />
        <Rect
          cornerRadius={cornerRadius}
          fill={descriptor.fill}
          height={innerHeight}
          width={innerWidth}
          x={padding.left}
          y={padding.top}
        />
      </Group>
    );
  }
);
