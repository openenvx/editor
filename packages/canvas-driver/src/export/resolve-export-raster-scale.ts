import {
  resolveArtboardDpi,
  resolveArtboardPixelDimensions,
} from '@openenvx/studio/schema';
import type { Artboard } from '@openenvx/studio/schema';

import type { CanvasExportOptions } from './canvas-document-export-service';

/** Combined user scale and dpi upsampling for raster export. */
export function resolveExportRasterScale(
  page: Artboard,
  options: CanvasExportOptions
): number {
  const pageDpi = resolveArtboardDpi(page);
  const exportDpi = resolveArtboardDpi(page, options.dpi);
  const scale = options.scale ?? 1;
  return scale * (exportDpi / pageDpi);
}

export function resolveExportStageDimensions(page: Artboard): {
  widthPx: number;
  heightPx: number;
} {
  const { width, height } = resolveArtboardPixelDimensions(page);
  return { heightPx: height, widthPx: width };
}
