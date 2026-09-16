import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';
import { memo } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';

import type { CanvasLayerRendererHostProps } from '../contributions/canvas-layer-renderer-contribution';
import { computeImageFitLayout } from '../image-fit';
import { readImageFocalPoint, readImageFit } from '../preview-image-fields';
import {
  ImageUploadingOverlay,
  imageUploadingOpacity,
} from './image-uploading-chrome';
import { useLoadedImage } from './use-loaded-image';

export { useLoadedImage } from './use-loaded-image';

type ImageView = Extract<LayerPreviewDescriptor, { kind: 'image' }>;

export const ImageCanvasRenderer = memo(
  ({ view, width, height, hidden = false }: CanvasLayerRendererHostProps) => {
    const descriptor = view as ImageView;
    const image = useLoadedImage(descriptor.src);
    const uploading = descriptor.uploading === true;

    if (hidden) {
      return <Rect fill="transparent" height={height} width={width} />;
    }

    if (!image) {
      return (
        <Rect
          fill={uploading ? '#e5e7eb' : '#f3f4f6'}
          height={height}
          stroke="#d1d5db"
          strokeWidth={1}
          width={width}
        />
      );
    }

    const layout = computeImageFitLayout(
      { height: image.naturalHeight, width: image.naturalWidth },
      { height, width },
      readImageFit(descriptor),
      readImageFocalPoint(descriptor)
    );

    return (
      <>
        <KonvaImage
          crop={layout.crop}
          height={layout.draw.height}
          image={image}
          opacity={imageUploadingOpacity(uploading)}
          width={layout.draw.width}
          x={layout.draw.x}
          y={layout.draw.y}
        />
        {uploading ? (
          <ImageUploadingOverlay height={height} width={width} />
        ) : null}
      </>
    );
  }
);
