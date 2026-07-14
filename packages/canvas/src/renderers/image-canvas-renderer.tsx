import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { memo } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';

import type { CanvasLayerRendererHostProps } from '../contributions/canvas-layer-renderer-contribution';
import { useLoadedImage } from './use-loaded-image';

export { useLoadedImage } from './use-loaded-image';

type ImageView = Extract<LayerPreviewDescriptor, { kind: 'image' }>;

export const ImageCanvasRenderer = memo(
  ({ view, width, height, hidden = false }: CanvasLayerRendererHostProps) => {
    const descriptor = view as ImageView;
    const image = useLoadedImage(descriptor.src);

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

    return <KonvaImage height={height} image={image} width={width} />;
  }
);
