import type { Page } from '@openenvx/schema';
import { findPresetForPage, toPx } from '@openenvx/schema';

import type { CanvasRect } from './stage/canvas-stage-interaction';

export const PRINT_MARGIN_MM = 10;

export function computePageSafeBounds(page: Page): CanvasRect | null {
  if (!findPresetForPage(page)) {
    return null;
  }
  const width = page.width;
  const height = page.height;
  if (width === undefined || height === undefined) {
    return null;
  }
  const dpi = page.dpi ?? 96;
  const inset = Math.round(toPx(PRINT_MARGIN_MM, 'mm', dpi));
  if (inset * 2 >= width || inset * 2 >= height) {
    return null;
  }
  return {
    height: height - inset * 2,
    width: width - inset * 2,
    x: inset,
    y: inset,
  };
}

export function defaultShowMarginsForPage(page: Page): boolean {
  return findPresetForPage(page) !== undefined;
}
