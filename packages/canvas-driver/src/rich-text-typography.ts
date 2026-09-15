import type { CSSProperties } from 'react';

export const DEFAULT_RICH_TEXT_FONT_FAMILY = 'Inter, sans-serif';
export const DEFAULT_RICH_TEXT_FONT_SIZE = 24;
export const DEFAULT_RICH_TEXT_FILL = '#111827';
export const RICH_TEXT_LINE_HEIGHT_MULTIPLIER = 1.4;
export const DEFAULT_RICH_TEXT_LETTER_SPACING = 0;
export const RICH_TEXT_OVERFLOW_WRAP = 'anywhere';
export const RICH_TEXT_WHITE_SPACE = 'pre-wrap';
export const RICH_TEXT_WORD_BREAK = 'break-word';

export function getRichTextLineHeight(
  fontSize: number,
  lineHeightMultiplier: number = RICH_TEXT_LINE_HEIGHT_MULTIPLIER
): number {
  return fontSize * lineHeightMultiplier;
}

export interface RichTextDomStyleOptions {
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  zoom?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export function getRichTextDomStyles(
  options: RichTextDomStyleOptions = {}
): CSSProperties {
  const fontSize = options.fontSize ?? DEFAULT_RICH_TEXT_FONT_SIZE;
  const fontFamily = options.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY;
  const fill = options.fill ?? DEFAULT_RICH_TEXT_FILL;
  const align = options.align ?? 'left';
  const zoom = options.zoom ?? 1;
  const scaledFontSize = fontSize * zoom;
  const lineHeightMultiplier =
    options.lineHeight ?? RICH_TEXT_LINE_HEIGHT_MULTIPLIER;
  const letterSpacing =
    options.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;

  return {
    color: fill,
    fontFamily,
    fontSize: scaledFontSize,
    letterSpacing: `${letterSpacing * zoom}px`,
    lineHeight: `${scaledFontSize * lineHeightMultiplier}px`,
    overflowWrap: RICH_TEXT_OVERFLOW_WRAP,
    textAlign: align,
    whiteSpace: RICH_TEXT_WHITE_SPACE,
    wordBreak: RICH_TEXT_WORD_BREAK,
  };
}
