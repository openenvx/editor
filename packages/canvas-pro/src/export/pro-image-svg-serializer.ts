import { escapeAttr } from '@openenvx/core';
import type { PreviewKindSvgSerializer } from '@openenvx/driver-image';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import {
  hasActiveCrop,
  readImageCrop,
  resolveNormalizedCrop,
} from '../crop/normalized-crop';

type ImageView = Extract<LayerPreviewDescriptor, { kind: 'image' }>;

function resolveImagePreserveAspectRatio(view: ImageView): string {
  const fit = view.fit;
  if (fit !== 'cover' && fit !== 'contain' && fit !== 'fill') {
    return 'none';
  }
  if (fit === 'fill') {
    return 'none';
  }
  const focal =
    view.focalPoint &&
    typeof view.focalPoint === 'object' &&
    typeof (view.focalPoint as { x?: unknown }).x === 'number' &&
    typeof (view.focalPoint as { y?: unknown }).y === 'number'
      ? (view.focalPoint as { x: number; y: number })
      : { x: 0.5, y: 0.5 };
  const xAlign = focal.x < 0.33 ? 'xMin' : focal.x > 0.66 ? 'xMax' : 'xMid';
  const yAlign = focal.y < 0.33 ? 'YMin' : focal.y > 0.66 ? 'YMax' : 'YMid';
  const meetOrSlice = fit === 'contain' ? 'meet' : 'slice';
  return `${xAlign}${yAlign} ${meetOrSlice}`;
}

export class ProImageSvgSerializer implements PreviewKindSvgSerializer {
  readonly kind = 'image';

  toSvgFragment(
    descriptor: LayerPreviewDescriptor,
    ctx: Parameters<PreviewKindSvgSerializer['toSvgFragment']>[1]
  ): string {
    const view = descriptor as ImageView;
    const { bounds } = ctx;
    const href = ctx.resolveAsset(view.src);
    const crop = resolveNormalizedCrop(readImageCrop(view));

    if (hasActiveCrop(crop)) {
      const clipId = `crop-${escapeAttr(ctx.layer.id)}`;
      const imageWidth = bounds.width / crop.width;
      const imageHeight = bounds.height / crop.height;
      const imageX = bounds.x - crop.x * imageWidth;
      const imageY = bounds.y - crop.y * imageHeight;

      return `<defs><clipPath id="${clipId}"><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" /></clipPath></defs><image href="${escapeAttr(href)}" x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}" clip-path="url(#${clipId})" />`;
    }

    const preserve = resolveImagePreserveAspectRatio(view);
    return `<image href="${escapeAttr(href)}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" preserveAspectRatio="${preserve}" />`;
  }
}
