import { describe, expect, it } from 'vitest';

import {
  buildGoogleFontsCss2Href,
  buildGoogleFontsCss2HrefBatch,
  parseGoogleFontVariant,
  pickGoogleFontLoadVariants,
} from './google-font-variant';

describe('google-font-variant', () => {
  it('parses google variant keys', () => {
    expect(parseGoogleFontVariant('regular')).toEqual({ ital: 0, wght: 400 });
    expect(parseGoogleFontVariant('italic')).toEqual({ ital: 1, wght: 400 });
    expect(parseGoogleFontVariant('700')).toEqual({ ital: 0, wght: 700 });
    expect(parseGoogleFontVariant('700italic')).toEqual({ ital: 1, wght: 700 });
  });

  it('picks preferred load variants', () => {
    expect(
      pickGoogleFontLoadVariants([
        '100',
        'regular',
        '700',
        'italic',
        '700italic',
      ])
    ).toEqual(['regular', 'italic', '700', '700italic']);
    expect(pickGoogleFontLoadVariants(['300', '500'])).toEqual(['300']);
  });

  it('builds css2 href', () => {
    expect(buildGoogleFontsCss2Href('Open Sans', ['regular', '700'])).toBe(
      'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap'
    );
    expect(
      buildGoogleFontsCss2Href('Roboto', ['regular', 'italic', '700'])
    ).toBe(
      'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&display=swap'
    );
  });

  it('builds batch css2 href', () => {
    expect(
      buildGoogleFontsCss2HrefBatch([
        { family: 'Inter', variants: ['regular', '700'] },
        { family: 'Roboto', variants: ['regular'] },
      ])
    ).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400&display=swap'
    );
  });
});
