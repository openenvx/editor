import { describe, expect, it } from 'vitest';

import { fitFontSize } from './fit-font-size';

describe('fitFontSize', () => {
  it('returns max when content already fits', () => {
    expect(fitFontSize(() => 40, 100, 8, 24)).toBe(24);
  });

  it('returns min when even min overflows', () => {
    expect(fitFontSize(() => 200, 50, 8, 24)).toBe(8);
  });

  it('binary-searches a fitting size', () => {
    // Height scales linearly with font size: h = 4 * fontSize
    const size = fitFontSize((fontSize) => fontSize * 4, 48, 8, 24);
    expect(size).toBeCloseTo(12, 1);
  });

  it('clamps inverted min/max', () => {
    expect(fitFontSize(() => 10, 100, 24, 8)).toBe(8);
  });
});
