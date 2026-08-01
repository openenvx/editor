import { toPx } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  computePageBleedEdgeBounds,
  computePageSafeBounds,
  defaultShowMarginsForPage,
} from './page-margins';
import { resolvePagePreset } from './page-presets';

describe('page-margins', () => {
  it('returns safe bounds inset for A4 at 96 dpi', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    const bounds = computePageSafeBounds({
      height: preset.height,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      presetId: 'a4-portrait',
      unit: 'mm',
      width: preset.width,
    });
    const inset = Math.round(toPx(10, 'mm', 96));
    expect(bounds?.x).toBe(inset);
    expect(bounds?.y).toBe(inset);
    expect(bounds?.width).toBe(preset.width - inset * 2);
    expect(bounds?.height).toBe(preset.height - inset * 2);
  });

  it('returns bleed edge bounds for print pages with default bleed', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    const bounds = computePageBleedEdgeBounds({
      height: preset.height,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      presetId: 'a4-portrait',
      unit: 'mm',
      width: preset.width,
    });
    expect(bounds).toEqual({
      height: preset.height,
      width: preset.width,
      x: 0,
      y: 0,
    });
  });

  it('returns null bleed edge when bleed is zero', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    expect(
      computePageBleedEdgeBounds({
        bleedMm: 0,
        height: preset.height,
        id: 'p1',
        layers: [],
        layout: 'absolute',
        name: 'Page',
        presetId: 'a4-portrait',
        unit: 'mm',
        width: preset.width,
      })
    ).toBeNull();
  });

  it('returns null safe bounds for custom px page sizes', () => {
    const bounds = computePageSafeBounds({
      height: 500,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      width: 700,
    });
    expect(bounds).toBeNull();
  });

  it('defaults show margins for print-eligible pages', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    expect(
      defaultShowMarginsForPage({
        height: preset.height,
        id: 'p1',
        layers: [],
        layout: 'absolute',
        name: 'Page',
        presetId: 'a4-portrait',
        unit: 'mm',
        width: preset.width,
      })
    ).toBe(true);
    expect(
      defaultShowMarginsForPage({
        height: 500,
        id: 'p1',
        layers: [],
        layout: 'absolute',
        name: 'Page',
        width: 700,
      })
    ).toBe(false);
  });
});
