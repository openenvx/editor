import { describe, expect, it } from 'vitest';

import { resolvePagePreset } from './page-presets';
import {
  computePagePrintBoxes,
  DEFAULT_BLEED_MM,
  DEFAULT_SAFE_MM,
  isPrintEligiblePage,
  resolvePageBleedMm,
  resolvePageSafeMm,
} from './page-print';
import type { Page } from './types';
import { toPx } from './units';

function a4Page(overrides: Partial<Page> = {}): Page {
  const preset = resolvePagePreset('a4-portrait')!;
  return {
    height: preset.height,
    id: 'p1',
    layers: [],
    layout: 'absolute',
    name: 'Page',
    presetId: 'a4-portrait',
    unit: 'mm',
    width: preset.width,
    ...overrides,
  };
}

describe('page-print', () => {
  it('treats preset pages as print-eligible', () => {
    expect(isPrintEligiblePage(a4Page())).toBe(true);
  });

  it('treats physical-unit pages as print-eligible', () => {
    expect(
      isPrintEligiblePage({
        height: 500,
        id: 'p1',
        layers: [],
        layout: 'absolute',
        name: 'Page',
        unit: 'mm',
        width: 700,
      })
    ).toBe(true);
  });

  it('treats px-only custom pages as not print-eligible', () => {
    expect(
      isPrintEligiblePage({
        height: 500,
        id: 'p1',
        layers: [],
        layout: 'absolute',
        name: 'Page',
        width: 700,
      })
    ).toBe(false);
  });

  it('defaults bleed/safe for print-eligible pages', () => {
    const page = a4Page();
    expect(resolvePageBleedMm(page)).toBe(DEFAULT_BLEED_MM);
    expect(resolvePageSafeMm(page)).toBe(DEFAULT_SAFE_MM);
  });

  it('defaults bleed/safe to 0 for non-print pages', () => {
    const page: Page = {
      height: 500,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      width: 700,
    };
    expect(resolvePageBleedMm(page)).toBe(0);
    expect(resolvePageSafeMm(page)).toBe(0);
  });

  it('honors explicit bleedMm and safeMm', () => {
    const page = a4Page({ bleedMm: 5, safeMm: 12 });
    expect(resolvePageBleedMm(page)).toBe(5);
    expect(resolvePageSafeMm(page)).toBe(12);
  });

  it('honors explicit zero bleed on print pages', () => {
    expect(resolvePageBleedMm(a4Page({ bleedMm: 0 }))).toBe(0);
  });

  it('computes print boxes in px from mm + dpi', () => {
    const page = a4Page({ bleedMm: 3, dpi: 96, safeMm: 10 });
    const boxes = computePagePrintBoxes(page);
    const bleedPx = Math.round(toPx(3, 'mm', 96));
    const safePx = Math.round(toPx(10, 'mm', 96));
    expect(boxes.trim.width).toBe(page.width);
    expect(boxes.trim.height).toBe(page.height);
    expect(boxes.bleedPx).toBe(bleedPx);
    expect(boxes.safePx).toBe(safePx);
    expect(boxes.safe).toEqual({
      height: page.height! - safePx * 2,
      width: page.width! - safePx * 2,
      x: safePx,
      y: safePx,
    });
  });

  it('returns null safe bounds when inset does not fit', () => {
    const page = a4Page({
      height: 20,
      safeMm: 10,
      width: 20,
    });
    const boxes = computePagePrintBoxes(page);
    expect(boxes.safe).toBeNull();
  });
});
