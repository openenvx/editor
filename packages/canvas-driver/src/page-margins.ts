import type { Artboard } from '@openenvx/studio/schema';
import {
  computeArtboardPrintBoxes,
  isPrintEligibleArtboard,
} from '@openenvx/studio/schema';

import type { CanvasRect } from './stage/canvas-stage-interaction';

export function computePageSafeBounds(page: Artboard): CanvasRect | null {
  return computeArtboardPrintBoxes(page).safe;
}

/** Trim-edge rect when bleed > 0 (marks bleed inner edge on the artboard). */
export function computePageBleedEdgeBounds(page: Artboard): CanvasRect | null {
  const boxes = computeArtboardPrintBoxes(page);
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

export function defaultShowMarginsForPage(page: Artboard): boolean {
  return isPrintEligibleArtboard(page);
}
