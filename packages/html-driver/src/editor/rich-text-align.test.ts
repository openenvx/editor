import { describe, expect, it } from 'vitest';

import {
  alignDataPathFromHtmlPath,
  parseRichTextAlign,
} from './rich-text-align';

describe('rich-text-align', () => {
  it('parses block align values', () => {
    expect(parseRichTextAlign('center')).toBe('center');
    expect(parseRichTextAlign('nope')).toBeUndefined();
  });

  it('maps html data paths to sibling align paths', () => {
    expect(alignDataPathFromHtmlPath('html')).toBe('align');
    expect(alignDataPathFromHtmlPath('slots.headline.0.data.html')).toBe(
      'slots.headline.0.data.align'
    );
  });
});
