import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { memo } from 'react';
import { Rect, Text } from 'react-konva';

import type { CanvasLayerRendererHostProps } from '../contributions/canvas-layer-renderer-contribution';

export const PlaceholderCanvasRenderer = memo(
  ({ view, width, height, hidden = false }: CanvasLayerRendererHostProps) => {
    const descriptor = view as LayerPreviewDescriptor;

    if (hidden) {
      return <Rect fill="transparent" height={height} width={width} />;
    }

    if (descriptor.kind === 'placeholder') {
      return (
        <Text
          fill="#6b7280"
          fontSize={14}
          height={height}
          text={typeof descriptor.text === 'string' ? descriptor.text : 'Layer'}
          width={width}
        />
      );
    }

    return (
      <Text
        fill="#6b7280"
        fontSize={14}
        height={height}
        text="Layer"
        width={width}
      />
    );
  }
);
