import { escapeAttr } from '@openenvx/core';
import type { PreviewKindSvgSerializer } from '@openenvx/driver-image';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import { readImageCrop, resolveNormalizedCrop } from '../crop/normalized-crop';

export class ProImageSvgSerializer implements PreviewKindSvgSerializer {
  readonly kind = 'image';

  toSvgFragment(
    descriptor: LayerPreviewDescriptor,
    ctx: Parameters<PreviewKindSvgSerializer['toSvgFragment']>[1]
  ): string {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'image' }
    >;
    const { bounds } = ctx;
    const href = ctx.resolveAsset(view.src);
    const crop = resolveNormalizedCrop(readImageCrop(view));

    if (crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1) {
      return `<image href="${escapeAttr(href)}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" />`;
    }

    const clipId = `crop-${escapeAttr(ctx.layer.id)}`;
    const imageWidth = bounds.width / crop.width;
    const imageHeight = bounds.height / crop.height;
    const imageX = bounds.x - crop.x * imageWidth;
    const imageY = bounds.y - crop.y * imageHeight;

    return `<defs><clipPath id="${clipId}"><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" /></clipPath></defs><image href="${escapeAttr(href)}" x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}" clip-path="url(#${clipId})" />`;
  }
}
