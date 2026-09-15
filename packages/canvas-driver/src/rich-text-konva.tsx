import { memo, useMemo } from 'react';
import { Rect, Text, TextPath } from 'react-konva';

import { DEFAULT_MIN_FONT_SIZE, fitFontSize } from './fit-font-size';
import {
  isCurvedText,
  layoutCurvedText,
  stripHtmlToPlainText,
} from './rich-text-arc';
import { layoutRichTextSpans } from './rich-text-konva-driver';
import {
  measurePlainTextWidth,
  measureRichTextHeight,
  toKonvaFontStyle,
  toKonvaTextDecoration,
} from './rich-text-layout';
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
  curve?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontLoadRevision?: number;
  autoFit?: 'none' | 'shrink';
  minFontSize?: number;
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
    curve = 0,
    lineHeight = RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
    letterSpacing = DEFAULT_RICH_TEXT_LETTER_SPACING,
    fontLoadRevision = 0,
    autoFit = 'none',
    minFontSize = DEFAULT_MIN_FONT_SIZE,
  }: RichTextKonvaProps) => {
    const curved = isCurvedText(curve);
    const resolvedFontSize = useMemo(() => {
      void fontLoadRevision;
      if (autoFit !== 'shrink' || curved) {
        return fontSize;
      }
      return fitFontSize(
        (size) =>
          measureRichTextHeight({
            align,
            fontFamily,
            fontSize: size,
            html,
            letterSpacing,
            lineHeightMultiplier: lineHeight,
            width,
          }),
        height,
        minFontSize,
        fontSize
      );
    }, [
      align,
      autoFit,
      curved,
      fontFamily,
      fontLoadRevision,
      fontSize,
      height,
      html,
      letterSpacing,
      lineHeight,
      minFontSize,
      width,
    ]);
    const plainText = useMemo(
      () => (curved ? stripHtmlToPlainText(html) : ''),
      [curved, html]
    );
    const curvedPathText = plainText.length > 0 ? plainText : ' ';
    const curvedLayout = useMemo(() => {
      void fontLoadRevision;
      if (!curved) {
        return null;
      }
      return layoutCurvedText({
        curve,
        fontFamily,
        fontSize: resolvedFontSize,
        letterSpacing,
        text: curvedPathText,
        textWidth: measurePlainTextWidth(
          curvedPathText,
          resolvedFontSize,
          fontFamily,
          letterSpacing
        ),
      });
    }, [
      curve,
      curved,
      curvedPathText,
      fontFamily,
      fontLoadRevision,
      letterSpacing,
      resolvedFontSize,
    ]);
    const allSpans = useMemo(() => {
      void fontLoadRevision;
      if (curved) {
        return [];
      }
      return layoutRichTextSpans({
        align,
        fill,
        fontFamily,
        fontSize: resolvedFontSize,
        height,
        html,
        letterSpacing,
        lineHeight,
        width,
      });
    }, [
      align,
      curved,
      fill,
      fontFamily,
      fontLoadRevision,
      height,
      html,
      letterSpacing,
      lineHeight,
      resolvedFontSize,
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
        {curved && curvedLayout ? (
          <TextPath
            align="center"
            data={curvedLayout.path}
            fill={fill}
            fontFamily={fontFamily}
            fontSize={resolvedFontSize}
            letterSpacing={letterSpacing}
            text={curvedPathText}
            textBaseline="middle"
            x={-curvedLayout.offsetX}
            y={-curvedLayout.offsetY}
          />
        ) : (
          allSpans.map((span, index) => (
            <Text
              fill={span.style.color ?? fill}
              fontFamily={span.style.fontFamily ?? fontFamily}
              fontSize={resolvedFontSize}
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
          ))
        )}
        {!curved && allSpans.length === 0 ? (
          <Text
            fill={fill}
            fontFamily={fontFamily}
            fontSize={resolvedFontSize}
            height={height}
            text=""
            width={width}
          />
        ) : null}
      </>
    );
  }
);
