import { describe, expect, it } from 'vitest';

import {
  buildCurvePath,
  curveToPower,
  estimateCurvedTextBounds,
  isCurvedText,
  stripHtmlToPlainText,
} from './rich-text-arc';

describe('rich-text-arc', () => {
  it('isCurvedText treats near-zero as straight', () => {
    expect(isCurvedText(0)).toBe(false);
    expect(isCurvedText(0.1)).toBe(false);
    expect(isCurvedText(null)).toBe(false);
    expect(isCurvedText(45)).toBe(true);
    expect(isCurvedText(-30)).toBe(true);
  });

  it('curveToPower maps ±100 onto ±0.9999…1', () => {
    expect(curveToPower(0)).toBe(0);
    expect(curveToPower(100)).toBeCloseTo(0.9999, 4);
    expect(curveToPower(-100)).toBeCloseTo(-0.9999, 4);
    expect(curveToPower(50)).toBeCloseTo(0.5, 4);
    expect(curveToPower(150)).toBeCloseTo(0.9999, 4);
  });

  it('buildCurvePath returns a midline for zero power', () => {
    expect(buildCurvePath(200, 40, 0, 24)).toBe('M 0 20 L 200 20');
  });

  it('buildCurvePath uses upper circle for positive power (arch)', () => {
    const path = buildCurvePath(200, 80, 0.5, 24);
    expect(path.startsWith('M 100 ')).toBe(true);
    expect(path.includes(' 0 1 1 ')).toBe(true);
    expect(path.includes(' 0 1 0 ')).toBe(false);
  });

  it('buildCurvePath uses lower circle for negative power (bowl)', () => {
    const path = buildCurvePath(200, 80, -0.5, 24);
    expect(path.startsWith('M 100 ')).toBe(true);
    expect(path.includes(' 0 1 0 ')).toBe(true);
  });

  it('estimateCurvedTextBounds grows with |curve|', () => {
    const straight = estimateCurvedTextBounds(200, 24, 0);
    const curved = estimateCurvedTextBounds(200, 24, curveToPower(80));
    expect(straight.height).toBe(24);
    expect(curved.height).toBeGreaterThan(straight.height);
    expect(curved.width).toBeGreaterThan(0);
  });

  it('stripHtmlToPlainText flattens markup', () => {
    expect(stripHtmlToPlainText('<p>Hello <strong>world</strong></p>')).toBe(
      'Hello world'
    );
  });
});
