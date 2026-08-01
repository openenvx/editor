import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { memo, useMemo } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';

import type { CanvasLayerRendererHostProps } from '../contributions/canvas-layer-renderer-contribution';
import {
  prepareSvgMarkup,
  svgMarkupToDataUrl,
} from '../svg/prepare-svg-markup';
import { useLoadedImage } from './use-loaded-image';

type SvgView = Extract<LayerPreviewDescriptor, { kind: 'svg' }>;

export const SvgCanvasRenderer = memo(
  ({ view, width, height, hidden = false }: CanvasLayerRendererHostProps) => {
    const descriptor = view as SvgView;
    const src = useMemo(
      () =>
        svgMarkupToDataUrl(
          prepareSvgMarkup(descriptor.svg, {
            fill: descriptor.fill,
            stroke: descriptor.stroke,
            viewBox: descriptor.viewBox,
          })
        ),
      [descriptor.fill, descriptor.stroke, descriptor.svg, descriptor.viewBox]
    );
    const image = useLoadedImage(src);

    if (hidden) {
      return <Rect fill="transparent" height={height} width={width} />;
    }

    if (!image) {
      return (
        <Rect
          fill="#f3f4f6"
          height={height}
          stroke="#d1d5db"
          strokeWidth={1}
          width={width}
        />
      );
    }

    return (
      <KonvaImage height={height} image={image} width={width} x={0} y={0} />
    );
  }
);
