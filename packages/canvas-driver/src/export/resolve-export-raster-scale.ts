import {
  resolvePageDpi,
  resolvePagePixelDimensions,
} from '@openenvx/studio/schema';
import type { Page } from '@openenvx/studio/schema';

import type { CanvasExportOptions } from './canvas-document-export-service';

/** Combined user scale and dpi upsampling for raster export. */
export function resolveExportRasterScale(
  page: Page,
  options: CanvasExportOptions
): number {
  const pageDpi = resolvePageDpi(page);
  const exportDpi = resolvePageDpi(page, options.dpi);
  const scale = options.scale ?? 1;
  return scale * (exportDpi / pageDpi);
}

export function resolveExportStageDimensions(page: Page): {
  widthPx: number;
  heightPx: number;
} {
  const { width, height } = resolvePagePixelDimensions(page);
  return { heightPx: height, widthPx: width };
}
