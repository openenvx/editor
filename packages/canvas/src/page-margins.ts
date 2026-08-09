import type { Page } from '@openenvx/core/schema';
import {
  computePagePrintBoxes,
  isPrintEligiblePage,
} from '@openenvx/core/schema';

import type { CanvasRect } from './stage/canvas-stage-interaction';

export function computePageSafeBounds(page: Page): CanvasRect | null {
  return computePagePrintBoxes(page).safe;
}

/** Trim-edge rect when bleed > 0 (marks bleed inner edge on the artboard). */
export function computePageBleedEdgeBounds(page: Page): CanvasRect | null {
  const boxes = computePagePrintBoxes(page);
  if (boxes.bleedPx <= 0) {
    return null;
  }
  return {
    height: boxes.trim.height,
    width: boxes.trim.width,
    x: 0,
    y: 0,
  };
}

export function defaultShowMarginsForPage(page: Page): boolean {
  return isPrintEligiblePage(page);
}
