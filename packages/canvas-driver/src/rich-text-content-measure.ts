import {
  measureRichTextHeight,
  measureRichTextIntrinsicContentWidth,
  RICH_TEXT_HUG_WIDTH_PAD,
} from './rich-text-layout';
import {
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from './rich-text-typography';

/**
 * Natural content size: width is the longest unwrapped line, height is the
 * laid-out height at that width (or at `maxWidth` when the line is longer).
 */
export function measureRichTextContentSize(options: {
  html: string;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
  lineHeightMultiplier?: number;
  letterSpacing?: number;
  maxWidth?: number;
}): { width: number; height: number } {
  const lineHeightMultiplier =
    options.lineHeightMultiplier ?? RICH_TEXT_LINE_HEIGHT_MULTIPLIER;
  const letterSpacing =
    options.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;

  const contentWidth = measureRichTextIntrinsicContentWidth({
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    html: options.html,
    letterSpacing,
    lineHeightMultiplier,
  });

  let width = Math.ceil(contentWidth) + RICH_TEXT_HUG_WIDTH_PAD;
  if (options.maxWidth !== undefined) {
    width = Math.min(width, Math.max(1, options.maxWidth));
  }

  const height = measureRichTextHeight({
    align: options.align,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    html: options.html,
    letterSpacing,
    lineHeightMultiplier,
    width,
  });

  return { height, width };
}
