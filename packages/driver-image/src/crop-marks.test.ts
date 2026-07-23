import { resolvePagePreset } from '@openenvx/canvas';
import { toPx } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  CROP_MARK_GUTTER_MM,
  shouldApplyCropMarks,
  wrapPageExportSvgIfNeeded,
  wrapTrimSvgWithCropMarks,
} from './crop-marks';

describe('crop-marks', () => {
  it('is a no-op when bleed is zero', () => {
    const trimSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50"><rect width="100" height="50" fill="#fff"/></svg>';
    const result = wrapTrimSvgWithCropMarks(trimSvg, {
      bleedPx: 0,
      trimHeightPx: 50,
      trimWidthPx: 100,
    });
    expect(result.svg).toBe(trimSvg);
    expect(result.widthPx).toBe(100);
    expect(result.heightPx).toBe(50);
  });

  it('expands media box and draws crop marks when bleed > 0', () => {
    const trimSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="#abc"/></svg>';
    const bleedPx = 11;
    const gutterPx = Math.round(toPx(CROP_MARK_GUTTER_MM, 'mm', 96));
    const result = wrapTrimSvgWithCropMarks(trimSvg, {
      bleedPx,
      gutterPx,
      trimHeightPx: 100,
      trimWidthPx: 200,
    });
    const offset = gutterPx + bleedPx;
    expect(result.widthPx).toBe(200 + offset * 2);
    expect(result.heightPx).toBe(100 + offset * 2);
    expect(result.svg).toContain(`translate(${offset} ${offset})`);
    expect(result.svg).toContain('fill="#abc"');
    expect(result.svg.match(/<line /g)?.length).toBe(8);
  });

  it('applies wrap for svg/pdf export on print pages', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    const page = {
      height: preset.height,
      id: 'p1',
      layers: [],
      layout: 'absolute' as const,
      name: 'Page',
      presetId: 'a4-portrait',
      unit: 'mm' as const,
      width: preset.width,
    };
    const trimSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}" height="${preset.height}" viewBox="0 0 ${preset.width} ${preset.height}"><rect width="10" height="10" fill="#000"/></svg>`;
    expect(shouldApplyCropMarks('svg', 3)).toBe(true);
    expect(shouldApplyCropMarks('png', 3)).toBe(false);
    const wrapped = wrapPageExportSvgIfNeeded(trimSvg, page, 'svg');
    expect(wrapped.bleedMm).toBe(3);
    expect(wrapped.widthPx).toBeGreaterThan(preset.width);
    expect(wrapped.svg).toContain('<line ');
    const raster = wrapPageExportSvgIfNeeded(trimSvg, page, 'png');
    expect(raster.svg).toBe(trimSvg);
    expect(raster.widthPx).toBe(preset.width);
  });
});
