import { describe, expect, it } from 'vitest';

import { computeScrubValue, formatNumericDisplay } from './numeric-scrub';

describe('computeScrubValue', () => {
  it('increases value when dragging right', () => {
    expect(computeScrubValue(10, 5)).toBe(15);
  });

  it('decreases value when dragging left', () => {
    expect(computeScrubValue(10, -3)).toBe(7);
  });

  it('respects step size', () => {
    expect(computeScrubValue(0, 10, { step: 0.5 })).toBe(5);
  });

  it('clamps to min and max', () => {
    expect(computeScrubValue(0, -10, { min: 0 })).toBe(0);
    expect(computeScrubValue(95, 10, { max: 100 })).toBe(100);
  });

  it('applies precision rounding', () => {
    expect(computeScrubValue(1, 3, { step: 0.1, precision: 1 })).toBe(1.3);
  });

  it('applies shift multiplier for coarse scrubbing', () => {
    expect(computeScrubValue(0, 1, { step: 1 }, { shift: true })).toBe(10);
  });

  it('applies alt multiplier for fine scrubbing', () => {
    expect(computeScrubValue(0, 10, { step: 1 }, { alt: true })).toBe(1);
  });

  it('uses custom pixelsPerStep', () => {
    expect(computeScrubValue(0, 20, { pixelsPerStep: 10 })).toBe(2);
  });
});

describe('formatNumericDisplay', () => {
  it('returns the raw value when precision is undefined', () => {
    expect(formatNumericDisplay(12.7)).toBe('12.7');
  });

  it('rounds to whole numbers when precision is 0', () => {
    expect(formatNumericDisplay(12.4, 0)).toBe('12');
    expect(formatNumericDisplay(12.6, 0)).toBe('13');
  });

  it('rounds to the requested decimal places', () => {
    expect(formatNumericDisplay(1.26, 1)).toBe('1.3');
  });
});
