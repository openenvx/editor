import { toPx } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PAGE_SIZE_PRESET,
  findPresetForPage,
  PAGE_SIZE_PRESETS,
  resolvePagePreset,
} from './page-presets';

describe('page-presets', () => {
  it('defines all six ISO presets at 96 DPI', () => {
    const cases = [
      ['a5-portrait', 148, 210],
      ['a5-landscape', 210, 148],
      ['a4-portrait', 210, 297],
      ['a4-landscape', 297, 210],
      ['a3-portrait', 297, 420],
      ['a3-landscape', 420, 297],
    ] as const;

    for (const [id, widthMm, heightMm] of cases) {
      const preset = resolvePagePreset(id);
      expect(preset).toBeDefined();
      expect(preset?.width).toBe(Math.round(toPx(widthMm, 'mm', 96)));
      expect(preset?.height).toBe(Math.round(toPx(heightMm, 'mm', 96)));
    }
  });

  it('orders presets from A5 to A3 with portrait before landscape', () => {
    expect(PAGE_SIZE_PRESETS.map((preset) => preset.id)).toEqual([
      'a5-portrait',
      'a5-landscape',
      'a4-portrait',
      'a4-landscape',
      'a3-portrait',
      'a3-landscape',
    ]);
  });

  it('findPresetForPage matches by width and height', () => {
    const a4 = resolvePagePreset('a4-portrait')!;
    const match = findPresetForPage({
      id: 'p1',
      name: 'Page',
      layout: 'absolute',
      width: a4.width,
      height: a4.height,
      layers: [],
    });
    expect(match?.id).toBe('a4-portrait');
  });

  it('defaults to A4 portrait', () => {
    expect(DEFAULT_PAGE_SIZE_PRESET.id).toBe('a4-portrait');
    expect(PAGE_SIZE_PRESETS.length).toBe(6);
  });
});
