import { describe, expect, it } from 'vitest';

import {
  layoutRichText,
  measureRichTextHeight,
  normalizeDomMeasuredSpanY,
  parseRichTextHtml,
  toKonvaFontStyle,
} from './rich-text-layout';
import {
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  getRichTextLineHeight,
} from './rich-text-typography';

describe('rich-text-layout', () => {
  it('parses bold and italic spans', () => {
    const spans = parseRichTextHtml('<p><strong>Bold</strong> plain</p>');
    expect(spans).toEqual([
      { style: { bold: true, italic: false, strike: false, underline: false }, text: 'Bold' },
      { style: { bold: false, italic: false, strike: false, underline: false }, text: ' plain' },
    ]);
  });

  it('maps font styles for konva', () => {
    expect(
      toKonvaFontStyle({
        bold: true,
        italic: true,
        strike: false,
        underline: false,
      })
    ).toBe('bold italic');
  });

  it('uses shared typography defaults', () => {
    expect(DEFAULT_RICH_TEXT_FONT_FAMILY).toBe('Inter, sans-serif');
    expect(DEFAULT_RICH_TEXT_FONT_SIZE).toBe(24);
    expect(getRichTextLineHeight(DEFAULT_RICH_TEXT_FONT_SIZE)).toBeCloseTo(33.6);
    expect(
      getRichTextLineHeight(DEFAULT_RICH_TEXT_FONT_SIZE, 2)
    ).toBeCloseTo(48);
  });

  it('normalizes DOM span y so Konva half-leading is not doubled', () => {
    const spans = normalizeDomMeasuredSpanY([
      {
        style: {
          bold: false,
          italic: false,
          strike: false,
          underline: false,
        },
        text: 'Hello',
        x: 0,
        y: 4.8,
      },
      {
        style: {
          bold: false,
          italic: false,
          strike: false,
          underline: false,
        },
        text: 'world',
        x: 0,
        y: 38.4,
      },
    ]);

    expect(spans[0]?.y).toBe(0);
    expect(spans[1]?.y).toBeCloseTo(33.6);
  });

  it('parses underline, strike, and paragraph breaks', () => {
    const spans = parseRichTextHtml(
      '<p><u>Under</u></p><p><s>Strike</s></p>'
    );
    expect(spans).toEqual([
      {
        style: {
          bold: false,
          italic: false,
          strike: false,
          underline: true,
        },
        text: 'Under',
      },
      {
        style: {
          bold: false,
          italic: false,
          strike: false,
          underline: false,
        },
        text: '\n',
      },
      {
        style: {
          bold: false,
          italic: false,
          strike: true,
          underline: false,
        },
        text: 'Strike',
      },
    ]);
  });

  it('lays out positioned spans within width', () => {
    const positioned = layoutRichText({
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      html: '<p>Hello world</p>',
      width: 400,
    });
    expect(positioned.length).toBeGreaterThan(0);
    expect(positioned[0]?.text).toBeTruthy();
  });

  it('measures rich text height from laid out spans', () => {
    const height = measureRichTextHeight({
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      html: '<p>Hello world</p>',
      width: 400,
    });
    expect(height).toBeGreaterThanOrEqual(getRichTextLineHeight(24));
  });

  it('accepts custom line height multiplier and letter spacing', () => {
    const defaultHeight = measureRichTextHeight({
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      html: '<p>Hello world</p>',
      width: 400,
    });
    const spacedHeight = measureRichTextHeight({
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      html: '<p>Hello world</p>',
      letterSpacing: 4,
      lineHeightMultiplier: 2,
      width: 400,
    });
    expect(spacedHeight).toBeGreaterThan(defaultHeight);

    const positioned = layoutRichText({
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      html: '<p>Hello world</p>',
      letterSpacing: 4,
      lineHeightMultiplier: 2,
      width: 400,
    });
    expect(positioned.length).toBeGreaterThan(0);
  });
});
