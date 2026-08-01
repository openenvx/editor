import { describe, expect, it } from 'vitest';

import { encodeQrToSvg } from './encode-qr-to-svg';

describe('encodeQrToSvg', () => {
  it('returns a placeholder for empty payloads', () => {
    const svg = encodeQrToSvg('   ');
    expect(svg).toContain('QR placeholder');
    expect(svg).toContain('<svg');
  });

  it('encodes a URL as SVG with default colors', () => {
    const svg = encodeQrToSvg('https://weselnemomenty.pl/e/demo');
    expect(svg).toContain('<svg');
    expect(svg).toMatch(/fill=["']#000000["']|fill=["']black["']/i);
  });

  it('applies foreground, background, margin, and ECC options', () => {
    const svg = encodeQrToSvg('https://example.com', {
      background: '#fff7ed',
      errorCorrection: 'H',
      foreground: '#1d4ed8',
      margin: 2,
    });
    expect(svg).toContain('#1d4ed8');
    expect(svg).toContain('#fff7ed');
  });

  it('returns placeholder when encoding fails on oversized payload', () => {
    const huge = `https://example.com/${'x'.repeat(4000)}`;
    const svg = encodeQrToSvg(huge);
    expect(svg).toContain('QR placeholder');
  });
});
