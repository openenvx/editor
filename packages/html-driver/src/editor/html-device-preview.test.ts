import { describe, expect, it } from 'vitest';

import {
  clampHtmlZoom,
  formatHtmlZoomLabel,
  resolveEffectiveZoom,
  resolveFitZoom,
  resolveFrameWidth,
  resolveScaledFrameWidth,
  stepHtmlZoom,
} from './html-device-preview';

describe('html-device-preview', () => {
  it('resolves fixed and fluid frame widths', () => {
    expect(resolveFrameWidth('mobile', 1200)).toBe(390);
    expect(resolveFrameWidth('desktop', 1200)).toBe(1600);
    expect(resolveFrameWidth('fluid', 1200)).toBe(1200);
    expect(resolveFrameWidth('fluid', 0)).toBe(0);
  });

  it('fit-zooms only when the frame is wider than the stage', () => {
    expect(resolveFitZoom(390, 1200)).toBe(1);
    expect(resolveFitZoom(1280, 800)).toBeCloseTo(800 / 1280);
    expect(resolveFitZoom(1280, 0)).toBe(1);
  });

  it('clamps and steps zoom factors (max is fit-width = 1)', () => {
    expect(clampHtmlZoom(0.1)).toBe(0.25);
    expect(clampHtmlZoom(3)).toBe(1);
    expect(stepHtmlZoom(0.9, 1)).toBe(1);
    expect(stepHtmlZoom(1, 1)).toBe(1);
    expect(stepHtmlZoom(0.25, -1)).toBe(0.25);
  });

  it('labels zoom factor and resolves effective CSS scale', () => {
    expect(formatHtmlZoomLabel(1)).toBe('100%');
    expect(formatHtmlZoomLabel(0.5)).toBe('50%');
    expect(resolveEffectiveZoom(1, 0.5)).toBeCloseTo(0.5);
    expect(resolveEffectiveZoom(0.5, 0.5)).toBeCloseTo(0.25);
    expect(resolveScaledFrameWidth(1280, 0.25)).toBe(320);
    expect(resolveScaledFrameWidth(0, 0.5)).toBe(0);
  });
});
