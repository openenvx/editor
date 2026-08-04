import { type Box, isMostlyVisible } from './box';
import {
  FLOATING_PILL_BOTTOM_INSET_PX,
  FLOATING_PILL_GAP_PX,
  FLOATING_PILL_MIN_VISIBLE_RATIO,
  FLOATING_PILL_TOP_INSET_PX,
} from './constants';
import { clearanceBelowObstacles } from './obstacles';

export type FloatingPillAlign = 'top-right' | 'top-center';

export type FloatingPillPlacement =
  | { kind: 'hidden'; reason: 'anchor-obscured' }
  | {
      kind: 'placed';
      align: FloatingPillAlign;
      /**
       * CSS `top` / `left` for the transform:
       * - top-right → `translate(-100%, -100%)` (bottom-right of pill)
       * - top-center → `translate(-50%, -100%)` (bottom-center of pill)
       */
      top: number;
      left: number;
    };

export interface PlaceFloatingPillInput {
  /** Selected block / selection bounds in viewport coords. */
  anchor: Box;
  pillWidth: number;
  pillHeight: number;
  viewport: Box;
  obstacles: readonly Box[];
  align?: FloatingPillAlign;
  /** Extra inset past the anchor edge before the pill (top-right only). */
  outlinePad?: number;
  gap?: number;
  topInset?: number;
  bottomInset?: number;
  minVisibleRatio?: number;
}

function preferredLeft(
  anchor: Box,
  align: FloatingPillAlign,
  outlinePad: number
): number {
  if (align === 'top-center') {
    return (anchor.left + anchor.right) / 2;
  }
  return anchor.right + outlinePad - 10;
}

function pillHorizontalSpan(
  left: number,
  align: FloatingPillAlign,
  pillWidth: number
): { left: number; right: number } {
  if (align === 'top-center') {
    return { left: left - pillWidth / 2, right: left + pillWidth / 2 };
  }
  return { left: left - pillWidth, right: left };
}

/**
 * Pin a floating pill above `anchor`.
 *
 * - Hide when the anchor is mostly scrolled off-screen.
 * - Prefer above the anchor; push down under top chrome / viewport inset.
 * - Never jump to the anchor bottom (tall roots stay pinned at the top).
 * - Clamp against the viewport bottom.
 */
export function placeFloatingPill(
  input: PlaceFloatingPillInput
): FloatingPillPlacement {
  const gap = input.gap ?? FLOATING_PILL_GAP_PX;
  const outlinePad = input.outlinePad ?? 3;
  const topInset = input.topInset ?? FLOATING_PILL_TOP_INSET_PX;
  const bottomInset = input.bottomInset ?? FLOATING_PILL_BOTTOM_INSET_PX;
  const minVisibleRatio =
    input.minVisibleRatio ?? FLOATING_PILL_MIN_VISIBLE_RATIO;
  const align = input.align ?? 'top-right';

  if (!isMostlyVisible(input.anchor, input.viewport, minVisibleRatio)) {
    return { kind: 'hidden', reason: 'anchor-obscured' };
  }

  const left = preferredLeft(input.anchor, align, outlinePad);
  const preferredTop = input.anchor.top - outlinePad - gap;

  if (input.pillWidth < 1 || input.pillHeight < 1) {
    return { kind: 'placed', align, top: preferredTop, left };
  }

  const span = pillHorizontalSpan(left, align, input.pillWidth);
  const minTop = clearanceBelowObstacles(
    span.left,
    span.right,
    input.obstacles,
    gap,
    topInset
  );

  // style.top is the pill's bottom edge (translateY -100%).
  let top = Math.max(preferredTop, minTop + input.pillHeight);
  const maxBottom = input.viewport.bottom - bottomInset;
  top = Math.min(top, maxBottom);
  if (top - input.pillHeight < minTop) {
    top = minTop + input.pillHeight;
  }

  return { kind: 'placed', align, top, left };
}

export function selectionBoxFromCoords(
  from: { top: number; bottom: number; left: number; right: number },
  to: { top: number; bottom: number; left: number; right: number }
): Box {
  return {
    top: Math.min(from.top, to.top),
    left: Math.min(from.left, to.left),
    bottom: Math.max(from.bottom, to.bottom),
    right: Math.max(from.right, to.right),
  };
}
