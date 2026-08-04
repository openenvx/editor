import { describe, expect, it } from 'vitest';

import { isMostlyVisible, visibleRatio, type Box } from './box';
import {
  FLOATING_PILL_GAP_PX,
  FLOATING_PILL_MIN_VISIBLE_RATIO,
  FLOATING_PILL_TOP_INSET_PX,
} from './constants';
import { placeFloatingPill } from './place-floating-pill';

const VIEWPORT: Box = { top: 0, left: 0, bottom: 800, right: 1200 };

describe('visibleRatio / isMostlyVisible', () => {
  it('reports how much of the subject is on-screen', () => {
    // Half scrolled off the top (100×100 box).
    const half: Box = { top: -50, left: 0, bottom: 50, right: 100 };
    expect(visibleRatio(half, VIEWPORT)).toBe(0.5);
    expect(isMostlyVisible(half, VIEWPORT)).toBe(true);
    expect(
      isMostlyVisible(half, VIEWPORT, FLOATING_PILL_MIN_VISIBLE_RATIO + 0.01)
    ).toBe(false);
  });
});

describe('placeFloatingPill', () => {
  it('pins above the anchor when clear', () => {
    const placement = placeFloatingPill({
      anchor: { top: 200, left: 100, bottom: 320, right: 400 },
      pillWidth: 180,
      pillHeight: 40,
      viewport: VIEWPORT,
      obstacles: [{ top: 8, left: 500, bottom: 48, right: 700 }],
      outlinePad: 3,
    });
    expect(placement).toEqual({
      kind: 'placed',
      align: 'top-right',
      top: 200 - 3 - FLOATING_PILL_GAP_PX,
      left: 400 + 3 - 10,
    });
  });

  it('hides when less than half the anchor is visible', () => {
    const placement = placeFloatingPill({
      // Only the bottom 40px of a 200px-tall block is on-screen.
      anchor: { top: -160, left: 100, bottom: 40, right: 400 },
      pillWidth: 180,
      pillHeight: 40,
      viewport: VIEWPORT,
      obstacles: [],
    });
    expect(placement).toEqual({
      kind: 'hidden',
      reason: 'anchor-obscured',
    });
  });

  it('pushes under a top toolbar while staying near the anchor top', () => {
    const toolbar: Box = { top: 12, left: 400, bottom: 52, right: 640 };
    const placement = placeFloatingPill({
      anchor: { top: 60, left: 300, bottom: 900, right: 520 },
      pillWidth: 180,
      pillHeight: 40,
      viewport: VIEWPORT,
      obstacles: [toolbar],
      outlinePad: 3,
    });
    expect(placement.kind).toBe('placed');
    if (placement.kind !== 'placed') {
      return;
    }
    expect(placement.top).toBe(52 + FLOATING_PILL_GAP_PX + 40);
    expect(placement.top).toBeLessThan(200);
  });

  it('respects the viewport top inset', () => {
    const placement = placeFloatingPill({
      anchor: { top: 20, left: 40, bottom: 80, right: 200 },
      pillWidth: 180,
      pillHeight: 40,
      viewport: VIEWPORT,
      obstacles: [],
      outlinePad: 3,
    });
    expect(placement.kind).toBe('placed');
    if (placement.kind !== 'placed') {
      return;
    }
    expect(placement.top - 40).toBe(FLOATING_PILL_TOP_INSET_PX);
  });

  it('centers above the anchor for top-center align', () => {
    const placement = placeFloatingPill({
      anchor: { top: 200, left: 100, bottom: 240, right: 300 },
      align: 'top-center',
      pillWidth: 200,
      pillHeight: 40,
      viewport: VIEWPORT,
      obstacles: [],
      outlinePad: 0,
    });
    expect(placement).toEqual({
      kind: 'placed',
      align: 'top-center',
      top: 200 - FLOATING_PILL_GAP_PX,
      left: 200,
    });
  });
});
