import { describe, expect, it } from 'vitest';

import { resolvePagePreset, toPx } from '@openenvx/schema';

import {
  computePageSafeBounds,
  PRINT_MARGIN_MM,
} from './page-margins';

describe('page-margins', () => {
  it('returns safe bounds inset for A4 at 96 dpi', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    const bounds = computePageSafeBounds({
      height: preset.height,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      width: preset.width,
    });
    const inset = Math.round(toPx(PRINT_MARGIN_MM, 'mm', 96));
    expect(bounds?.x).toBe(inset);
    expect(bounds?.y).toBe(inset);
    expect(bounds?.width).toBe(preset.width - inset * 2);
    expect(bounds?.height).toBe(preset.height - inset * 2);
  });

  it('returns null for custom page sizes', () => {
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
});
