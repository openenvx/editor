import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';
import type { FocalPoint, ImageFit } from '@openenvx/studio/schema';

type ImageView = Extract<LayerPreviewDescriptor, { kind: 'image' }>;

export function readImageFit(view: ImageView): ImageFit | undefined {
  const fit = view.fit;
  if (fit === 'cover' || fit === 'contain' || fit === 'fill') {
    return fit;
  }
  return undefined;
}

export function readImageFocalPoint(view: ImageView): FocalPoint | undefined {
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
