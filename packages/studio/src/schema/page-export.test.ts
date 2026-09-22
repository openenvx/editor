import { describe, expect, it } from 'vitest';

import {
  artboardPhysicalSize,
  computeArtboardExportDimensions,
  resolveArtboardPixelDimensions,
  resolveArtboardPresetId,
} from './page-export';
import type { Artboard } from './types';

/** A4 portrait at 96 DPI (210×297 mm). */
const A4 = { width: 794, height: 1123 };

function absoluteArtboard(overrides: Partial<Artboard> = {}): Artboard {
  return {
    extensions: { layout: 'absolute' },
    id: 'page-1',
    name: 'Artboard',
    nodes: [],
    physical: {
      dpi: 96,
      presetId: 'a4-portrait',
      unit: 'mm',
      ...overrides.physical,
    },
    space: { height: A4.height, width: A4.width, ...overrides.space },
    ...overrides,
  };
}

describe('page-export', () => {
  it('preserves explicit preset id on the artboard model', () => {
    const artboard = absoluteArtboard({
      physical: { dpi: 96, presetId: 'a4-portrait', unit: 'mm' },
    });
    expect(resolveArtboardPresetId(artboard)).toBe('a4-portrait');
  });

  it('throws when artboard is missing width/height', () => {
    expect(() =>
      resolveArtboardPixelDimensions({
        extensions: { layout: 'absolute' },
        id: 'page-1',
        name: 'Broken',
        nodes: [],
        physical: { dpi: 96, unit: 'px' },
        space: {},
      })
    ).toThrow(/missing space width\/height/);
  });

  it('computes scaled export dimensions from artboard pixels', () => {
    const artboard = absoluteArtboard({
      physical: { dpi: 96, presetId: 'a4-portrait', unit: 'mm' },
      space: { height: 1000, width: 800 },
    });
    const dimensions = computeArtboardExportDimensions(artboard, { scale: 2 });
    expect(dimensions).toEqual({
      artboardDpi: 96,
      artboardPresetId: 'a4-portrait',
      artboardUnit: 'mm',
      heightPx: 2000,
      widthPx: 1600,
    });
  });

  it('derives physical artboard size from pixels and unit', () => {
    const artboard = absoluteArtboard({
      physical: { dpi: 96, presetId: 'a4-portrait', unit: 'mm' },
      space: { height: 1123, width: 794 },
    });
    const physical = artboardPhysicalSize(artboard);
    expect(physical.unit).toBe('mm');
    expect(physical.width).toBeCloseTo(210, 0);
    expect(physical.height).toBeCloseTo(297, 0);
  });
});
