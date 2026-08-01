import type { Transform } from '@openenvx/schema';
import Konva from 'konva';

import { applyTransformToNode } from './geometry';
import {
  buildArcPath,
  isCurvedText,
  stripHtmlToPlainText,
} from './rich-text-arc';
import {
  layoutRichText,
  toKonvaFontStyle,
  toKonvaTextDecoration,
} from './rich-text-layout';
import {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from './rich-text-typography';

export interface RichTextLayerView {
  align?: 'left' | 'center' | 'right';
  curve?: number;
  fill?: string;
  fontFamily?: string;
  html: string;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface RichTextLayoutOptions {
  align?: 'left' | 'center' | 'right';
  fill?: string;
  fontFamily?: string;
  fontSize: number;
  height: number;
  html: string;
  width: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export function layoutRichTextSpans(options: RichTextLayoutOptions) {
  const {
    align = 'left',
    fontFamily = DEFAULT_RICH_TEXT_FONT_FAMILY,
    fontSize,
    html,
    width,
    lineHeight = RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
    letterSpacing = DEFAULT_RICH_TEXT_LETTER_SPACING,
  } = options;

  return layoutRichText({
    align,
    fontFamily,
    fontSize,
    html,
    letterSpacing,
    lineHeightMultiplier: lineHeight,
    width,
  });
}

export function applyRichTextToGroup(
  node: Konva.Group,
  view: RichTextLayerView,
  transform: Transform,
  fontSize: number
): void {
  applyTransformToNode(node, transform);

  const width = transform.width;
  const height = transform.height;
  const fill = view.fill ?? DEFAULT_RICH_TEXT_FILL;
  const fontFamily = view.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY;
  const align = view.align ?? 'left';
  const lineHeight = view.lineHeight ?? RICH_TEXT_LINE_HEIGHT_MULTIPLIER;
  const letterSpacing = view.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;
  const curve = view.curve ?? 0;

  node.destroyChildren();

  node.add(
    new Konva.Rect({
      fill: 'rgba(0,0,0,0.001)',
      height,
      listening: false,
      width,
    })
  );

  if (isCurvedText(curve)) {
    node.add(
      new Konva.TextPath({
        align,
        data: buildArcPath(width, fontSize, curve),
        fill,
        fontFamily,
        fontSize,
        letterSpacing,
        text: stripHtmlToPlainText(view.html),
      })
    );
    node.getLayer()?.batchDraw();
    return;
  }

  const spans = layoutRichTextSpans({
    align,
    fontFamily,
    fontSize,
    height,
    html: view.html,
    letterSpacing,
    lineHeight,
    width,
  });

  for (const span of spans) {
    node.add(
      new Konva.Text({
        fill: span.style.color ?? fill,
        fontFamily: span.style.fontFamily ?? fontFamily,
        fontSize,
        fontStyle: toKonvaFontStyle(span.style),
        letterSpacing,
        lineHeight,
        text: span.text,
        textDecoration: toKonvaTextDecoration(span.style),
        verticalAlign: 'top',
        x: span.x,
        y: span.y,
      })
    );
  }

  if (spans.length === 0) {
    node.add(
      new Konva.Text({
        fill,
        fontFamily,
        fontSize,
        height,
        text: '',
        width,
      })
    );
  }

  node.getLayer()?.batchDraw();
}
