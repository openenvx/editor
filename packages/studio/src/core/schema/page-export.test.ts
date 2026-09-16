import { describe, expect, it } from 'vitest';

import {
  computePageExportDimensions,
  pagePhysicalSize,
  resolvePagePixelDimensions,
  resolvePagePresetId,
} from './page-export';
import type { Page } from './types';

/** A4 portrait at 96 DPI (210×297 mm). */
const A4 = { width: 794, height: 1123 };

function absolutePage(overrides: Partial<Page> = {}): Page {
  return {
    height: A4.height,
    id: 'page-1',
    layers: [],
    layout: 'absolute',
    name: 'Artboard',
    presetId: 'a4-portrait',
    unit: 'mm',
    width: A4.width,
    ...overrides,
  };
}

describe('page-export', () => {
  it('preserves explicit preset id on the page model', () => {
    const page = absolutePage({ presetId: 'a4-portrait' });
    expect(resolvePagePresetId(page)).toBe('a4-portrait');
  });

  it('throws when page is missing width/height', () => {
    expect(() =>
      resolvePagePixelDimensions({
        id: 'page-1',
        layers: [],
        layout: 'absolute',
        name: 'Broken',
      })
    ).toThrow(/missing width\/height/);
  });

  it('computes scaled export dimensions from page pixels', () => {
    const page = absolutePage({ dpi: 96, height: 1000, width: 800 });
    const dimensions = computePageExportDimensions(page, { scale: 2 });
    expect(dimensions).toEqual({
      heightPx: 2000,
      pageDpi: 96,
      pagePresetId: 'a4-portrait',
      pageUnit: 'mm',
      widthPx: 1600,
    });
  });

  it('derives physical page size from pixels and unit', () => {
    const page = absolutePage({ dpi: 96, height: 1123, width: 794 });
    const physical = pagePhysicalSize(page);
    expect(physical.unit).toBe('mm');
    expect(physical.width).toBeCloseTo(210, 0);
    expect(physical.height).toBeCloseTo(297, 0);
  });
});
