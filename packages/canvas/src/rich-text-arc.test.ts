import { describe, expect, it } from 'vitest';

import {
  buildArcPath,
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

  it('buildArcPath returns a straight line for zero curve', () => {
    expect(buildArcPath(200, 24, 0)).toBe('M 0,24 L 200,24');
  });

  it('buildArcPath returns a downward smile arc for positive curve', () => {
    const path = buildArcPath(200, 24, 60);
    expect(path.startsWith('M 0,24 A ')).toBe(true);
    expect(path.endsWith(' 0 0 1 200,24')).toBe(true);
  });

  it('buildArcPath returns an upward frown arc for negative curve', () => {
    const path = buildArcPath(200, 24, -60);
    expect(path.startsWith('M 0,')).toBe(true);
    expect(path.includes(' 0 0 0 200,')).toBe(true);
  });

  it('stripHtmlToPlainText flattens markup', () => {
    expect(stripHtmlToPlainText('<p>Hello <strong>world</strong></p>')).toBe(
      'Hello world'
    );
  });
});
