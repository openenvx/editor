import { toPx } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  computePageBleedEdgeBounds,
  computePageSafeBounds,
  defaultShowMarginsForPage,
} from './page-margins';
import { resolvePagePreset } from './page-presets';
import { legacyArtboard } from './test/canvas-document-fixtures';

describe('page-margins', () => {
  it('returns safe bounds inset for A4 at 96 dpi', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    const bounds = computePageSafeBounds(
      legacyArtboard({
        height: preset.height,
        id: 'p1',
        presetId: 'a4-portrait',
        width: preset.width,
      })
    );
    const inset = Math.round(toPx(10, 'mm', 96));
    expect(bounds?.x).toBe(inset);
    expect(bounds?.y).toBe(inset);
    expect(bounds?.width).toBe(preset.width - inset * 2);
    expect(bounds?.height).toBe(preset.height - inset * 2);
  });

  it('returns bleed edge bounds for print pages with default bleed', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    const bounds = computePageBleedEdgeBounds(
      legacyArtboard({
        height: preset.height,
        id: 'p1',
        presetId: 'a4-portrait',
        width: preset.width,
      })
    );
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
      computePageBleedEdgeBounds(
        legacyArtboard({
          bleedMm: 0,
          height: preset.height,
          id: 'p1',
          presetId: 'a4-portrait',
          width: preset.width,
        })
      )
    ).toBeNull();
  });

  it('returns null safe bounds for custom px page sizes', () => {
    const bounds = computePageSafeBounds(
      legacyArtboard({
        height: 500,
        id: 'p1',
        width: 700,
      })
    );
    expect(bounds).toBeNull();
  });

  it('defaults show margins for print-eligible pages', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    expect(
      defaultShowMarginsForPage(
        legacyArtboard({
          height: preset.height,
          id: 'p1',
          presetId: 'a4-portrait',
          width: preset.width,
        })
      )
    ).toBe(true);
    expect(
      defaultShowMarginsForPage(
        legacyArtboard({
          height: 500,
          id: 'p1',
          width: 700,
        })
      )
    ).toBe(false);
  });
});
