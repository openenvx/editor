import { describe, expect, it } from 'vitest';

import {
  computeArtboardPrintBoxes,
  DEFAULT_BLEED_MM,
  DEFAULT_SAFE_MM,
  isPrintEligibleArtboard,
  resolveArtboardBleedMm,
  resolveArtboardSafeMm,
} from './page-print';
import type { Artboard } from './types';
import { toPx } from './units';

/** A4 portrait at 96 DPI (210×297 mm). */
const A4 = { width: 794, height: 1123 };

function a4Artboard(overrides: Partial<Artboard> = {}): Artboard {
  return {
    extensions: { layout: 'absolute' },
    id: 'p1',
    name: 'Page',
    nodes: [],
    physical: { presetId: 'a4-portrait', unit: 'mm' },
    space: { height: A4.height, width: A4.width },
    ...overrides,
  };
}

describe('page-print', () => {
  it('treats preset artboards as print-eligible', () => {
    expect(isPrintEligibleArtboard(a4Artboard())).toBe(true);
  });

  it('treats physical-unit artboards as print-eligible', () => {
    expect(
      isPrintEligibleArtboard({
        extensions: { layout: 'absolute' },
        id: 'p1',
        name: 'Page',
        nodes: [],
        physical: { unit: 'mm' },
        space: { height: 500, width: 700 },
      })
    ).toBe(true);
  });

  it('treats px-only custom artboards as not print-eligible', () => {
    expect(
      isPrintEligibleArtboard({
        extensions: { layout: 'absolute' },
        id: 'p1',
        name: 'Page',
        nodes: [],
        space: { height: 500, width: 700 },
      })
    ).toBe(false);
  });

  it('defaults bleed/safe for print-eligible artboards', () => {
    const artboard = a4Artboard();
    expect(resolveArtboardBleedMm(artboard)).toBe(DEFAULT_BLEED_MM);
    expect(resolveArtboardSafeMm(artboard)).toBe(DEFAULT_SAFE_MM);
  });

  it('defaults bleed/safe to 0 for non-print artboards', () => {
    const artboard: Artboard = {
      extensions: { layout: 'absolute' },
      id: 'p1',
      name: 'Page',
      nodes: [],
      space: { height: 500, width: 700 },
    };
    expect(resolveArtboardBleedMm(artboard)).toBe(0);
    expect(resolveArtboardSafeMm(artboard)).toBe(0);
  });

  it('honors explicit bleedMm and safeMm', () => {
    const artboard = a4Artboard({
      physical: { bleedMm: 5, presetId: 'a4-portrait', safeMm: 12, unit: 'mm' },
    });
    expect(resolveArtboardBleedMm(artboard)).toBe(5);
    expect(resolveArtboardSafeMm(artboard)).toBe(12);
  });

  it('honors explicit zero bleed on print artboards', () => {
    expect(
      resolveArtboardBleedMm(
        a4Artboard({ physical: { bleedMm: 0, presetId: 'a4-portrait', unit: 'mm' } })
      )
    ).toBe(0);
  });

  it('computes print boxes in px from mm + dpi', () => {
    const artboard = a4Artboard({
      physical: { bleedMm: 3, dpi: 96, presetId: 'a4-portrait', safeMm: 10, unit: 'mm' },
    });
    const boxes = computeArtboardPrintBoxes(artboard);
    const bleedPx = Math.round(toPx(3, 'mm', 96));
    const safePx = Math.round(toPx(10, 'mm', 96));
    expect(boxes.trim.width).toBe(A4.width);
    expect(boxes.trim.height).toBe(A4.height);
    expect(boxes.bleedPx).toBe(bleedPx);
    expect(boxes.safePx).toBe(safePx);
    expect(boxes.safe).toEqual({
      height: A4.height - safePx * 2,
      width: A4.width - safePx * 2,
      x: safePx,
      y: safePx,
    });
  });

  it('returns null safe bounds when inset does not fit', () => {
    const artboard = a4Artboard({
      physical: { presetId: 'a4-portrait', safeMm: 10, unit: 'mm' },
      space: { height: 20, width: 20 },
    });
    const boxes = computeArtboardPrintBoxes(artboard);
    expect(boxes.safe).toBeNull();
  });
});
