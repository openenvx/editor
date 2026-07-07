import { memo, useMemo } from 'react';
import { Rect, Text } from 'react-konva';

import { layoutRichTextSpans } from './rich-text-konva-driver';
import { toKonvaFontStyle, toKonvaTextDecoration } from './rich-text-layout';
import {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from './rich-text-typography';

export interface RichTextKonvaProps {
  html: string;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  fontLoadRevision?: number;
}

export const RichTextKonva = memo(
  ({
    html,
    width,
    height,
    fontSize = DEFAULT_RICH_TEXT_FONT_SIZE,
    fontFamily = DEFAULT_RICH_TEXT_FONT_FAMILY,
    fill = DEFAULT_RICH_TEXT_FILL,
    align = 'left',
    lineHeight = RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
    letterSpacing = DEFAULT_RICH_TEXT_LETTER_SPACING,
    fontLoadRevision = 0,
  }: RichTextKonvaProps) => {
    const allSpans = useMemo(() => {
      void fontLoadRevision;
      return layoutRichTextSpans({
        align,
        fill,
        fontFamily,
        fontSize,
        height,
        html,
        letterSpacing,
        lineHeight,
        width,
      });
    }, [
      align,
      fill,
      fontFamily,
      fontLoadRevision,
      fontSize,
      height,
      html,
      letterSpacing,
      lineHeight,
      width,
    ]);
    return (
      <>
        <Rect
          fill="rgba(0,0,0,0.001)"
          height={height}
          listening={false}
          width={width}
        />
        {allSpans.map((span, index) => (
          <Text
            fill={fill}
            fontFamily={fontFamily}
            fontSize={fontSize}
            fontStyle={toKonvaFontStyle(span.style)}
            key={`${index}-${span.x}-${span.y}-${span.text}`}
            letterSpacing={letterSpacing}
            lineHeight={lineHeight}
            text={span.text}
            textDecoration={toKonvaTextDecoration(span.style)}
            verticalAlign="top"
            x={span.x}
            y={span.y}
          />
        ))}
        {allSpans.length === 0 ? (
          <Text
            fill={fill}
            fontFamily={fontFamily}
            fontSize={fontSize}
            height={height}
            text=""
            width={width}
          />
        ) : null}
      </>
    );
  }
);
