import {
  useLoadedImage,
  type CanvasLayerRendererHostProps,
} from '@openenvx/canvas';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { memo } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';

import {
  readImageCrop,
  resolveNormalizedCrop,
  type NormalizedCrop,
} from '../crop/normalized-crop';

type ImageView = Extract<LayerPreviewDescriptor, { kind: 'image' }>;

function toKonvaCrop(
  crop: NormalizedCrop,
  naturalWidth: number,
  naturalHeight: number
) {
  return {
    height: crop.height * naturalHeight,
    width: crop.width * naturalWidth,
    x: crop.x * naturalWidth,
    y: crop.y * naturalHeight,
  };
}

export const ProImageCanvasRenderer = memo(
  ({ view, width, height, hidden = false }: CanvasLayerRendererHostProps) => {
    const descriptor = view as ImageView;
    const image = useLoadedImage(descriptor.src);
    const crop = resolveNormalizedCrop(readImageCrop(descriptor));

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

    const konvaCrop = toKonvaCrop(
      crop,
      image.naturalWidth,
      image.naturalHeight
    );

    return (
      <KonvaImage
        crop={konvaCrop}
        height={height}
        image={image}
        width={width}
      />
    );
  }
);
