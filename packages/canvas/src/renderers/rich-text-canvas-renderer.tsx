import type { LayerPreviewDescriptor } from '@openenvx/core/preview';
import { memo } from 'react';
import { Rect } from 'react-konva';

import type { CanvasLayerRendererHostProps } from '../contributions/canvas-layer-renderer-contribution';
import { RichTextKonva } from '../rich-text-konva';

type RichTextView = Extract<LayerPreviewDescriptor, { kind: 'richText' }>;

export const RichTextCanvasRenderer = memo(
  ({
    view,
    width,
    height,
    hidden = false,
    fontLoadRevision = 0,
  }: CanvasLayerRendererHostProps) => {
    const descriptor = view as RichTextView;

    if (hidden) {
      return <Rect fill="transparent" height={height} width={width} />;
    }

    return (
      <RichTextKonva
        align={descriptor.align}
        autoFit={descriptor.autoFit}
        curve={descriptor.curve}
        fill={descriptor.fill}
        fontFamily={descriptor.fontFamily}
        fontLoadRevision={fontLoadRevision}
        fontSize={descriptor.fontSize}
        height={height}
        html={descriptor.html}
        letterSpacing={descriptor.letterSpacing}
        lineHeight={descriptor.lineHeight}
        minFontSize={descriptor.minFontSize}
        width={width}
      />
    );
  }
);
