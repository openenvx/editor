import {
  computeImageFitLayout,
  useLoadedImage,
  type CanvasLayerRendererHostProps,
} from '@openenvx/canvas';
import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import type { FocalPoint, ImageFit } from '@xmazu/openenvxee-schema';
import { memo } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';

import {
  hasActiveCrop,
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

function readFit(view: ImageView): ImageFit | undefined {
  const fit = view.fit;
  if (fit === 'cover' || fit === 'contain' || fit === 'fill') {
    return fit;
  }
  return undefined;
}

function readFocalPoint(view: ImageView): FocalPoint | undefined {
  const focal = view.focalPoint;
  if (
    focal &&
    typeof focal === 'object' &&
    typeof (focal as FocalPoint).x === 'number' &&
    typeof (focal as FocalPoint).y === 'number'
  ) {
    return focal as FocalPoint;
  }
  return undefined;
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

    // Manual crop (pro) wins over fit mode when active.
    if (hasActiveCrop(crop)) {
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

    const layout = computeImageFitLayout(
      { height: image.naturalHeight, width: image.naturalWidth },
      { height, width },
      readFit(descriptor),
      readFocalPoint(descriptor)
    );

    return (
      <KonvaImage
        crop={layout.crop}
        height={layout.draw.height}
        image={image}
        width={layout.draw.width}
        x={layout.draw.x}
        y={layout.draw.y}
      />
    );
  }
);
