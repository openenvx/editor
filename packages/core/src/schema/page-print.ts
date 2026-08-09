import { resolvePagePixelDimensions, resolvePagePresetId } from './page-export';
import type { Page } from './types';
import { toPx } from './units';

export const DEFAULT_BLEED_MM = 3;
export const DEFAULT_SAFE_MM = 10;

export interface PagePrintRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PagePrintBoxes {
  bleedMm: number;
  bleedPx: number;
  dpi: number;
  safe: PagePrintRect | null;
  safeMm: number;
  safePx: number;
  trim: { width: number; height: number };
}

export function isPrintEligiblePage(page: Page): boolean {
  if (resolvePagePresetId(page)) {
    return true;
  }
  return page.unit !== undefined && page.unit !== 'px';
}

export function resolvePageBleedMm(page: Page): number {
  if (page.bleedMm !== undefined) {
    return page.bleedMm;
  }
  return isPrintEligiblePage(page) ? DEFAULT_BLEED_MM : 0;
}

export function resolvePageSafeMm(page: Page): number {
  if (page.safeMm !== undefined) {
    return page.safeMm;
  }
  return isPrintEligiblePage(page) ? DEFAULT_SAFE_MM : 0;
}

export function computePagePrintBoxes(
  page: Page,
  options: { dpi?: number } = {}
): PagePrintBoxes {
  const trim = resolvePagePixelDimensions(page);
  const dpi = options.dpi ?? page.dpi ?? 96;
  const bleedMm = resolvePageBleedMm(page);
  const safeMm = resolvePageSafeMm(page);
  const bleedPx = Math.round(toPx(bleedMm, 'mm', dpi));
  const safePx = Math.round(toPx(safeMm, 'mm', dpi));

  let safe: PagePrintRect | null = null;
  if (safePx > 0 && safePx * 2 < trim.width && safePx * 2 < trim.height) {
    safe = {
      height: trim.height - safePx * 2,
      width: trim.width - safePx * 2,
      x: safePx,
      y: safePx,
    };
  }

  return {
    bleedMm,
    bleedPx,
    dpi,
    safe,
    safeMm,
    safePx,
    trim,
  };
}
