import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import { memo } from 'react';
import { Ellipse, Rect } from 'react-konva';

import type { CanvasLayerRendererHostProps } from '../contributions/canvas-layer-renderer-contribution';

type EllipseView = Extract<LayerPreviewDescriptor, { kind: 'ellipse' }>;

export const EllipseCanvasRenderer = memo(
  ({ view, width, height, hidden = false }: CanvasLayerRendererHostProps) => {
    const descriptor = view as EllipseView;

    if (hidden) {
      return <Rect fill="transparent" height={height} width={width} />;
    }

    return (
      <Ellipse
        fill={descriptor.fill}
        radiusX={width / 2}
        radiusY={height / 2}
        stroke={descriptor.stroke}
        strokeWidth={descriptor.strokeWidth ?? 0}
        x={width / 2}
        y={height / 2}
      />
    );
  }
);
