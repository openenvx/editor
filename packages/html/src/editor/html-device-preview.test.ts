import { describe, expect, it } from 'vitest';

import {
  clampHtmlZoom,
  formatHtmlZoomLabel,
  resolveAutoZoom,
  resolveFrameWidth,
  resolveScaledFrameWidth,
  stepHtmlZoom,
} from './html-device-preview';

describe('html-device-preview', () => {
  it('resolves fixed and fluid frame widths', () => {
    expect(resolveFrameWidth('mobile', 1200)).toBe(390);
    expect(resolveFrameWidth('desktop', 1200)).toBe(1280);
    expect(resolveFrameWidth('fluid', 1200)).toBe(1200);
    expect(resolveFrameWidth('fluid', 0)).toBe(0);
  });

  it('auto-zooms only when the frame is wider than the stage', () => {
    expect(resolveAutoZoom(390, 1200)).toBe(1);
    expect(resolveAutoZoom(1280, 800)).toBeCloseTo(800 / 1280);
    expect(resolveAutoZoom(1280, 0)).toBe(1);
  });

  it('clamps and steps zoom', () => {
    expect(clampHtmlZoom(0.1)).toBe(0.25);
    expect(clampHtmlZoom(3)).toBe(2);
    expect(stepHtmlZoom(1, 1)).toBe(1.1);
    expect(stepHtmlZoom(0.25, -1)).toBe(0.25);
  });

  it('formats zoom labels and scaled frame width', () => {
    expect(formatHtmlZoomLabel(0.6, true)).toBe('60% (Auto)');
    expect(formatHtmlZoomLabel(1, false)).toBe('100%');
    expect(resolveScaledFrameWidth(1280, 0.25)).toBe(320);
    expect(resolveScaledFrameWidth(0, 0.5)).toBe(0);
  });
});
