import {
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  getRichTextLineHeight,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
  RICH_TEXT_OVERFLOW_WRAP,
  RICH_TEXT_WHITE_SPACE,
  RICH_TEXT_WORD_BREAK,
} from './rich-text-typography';

export interface RichTextStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}

export interface StyledSpan {
  text: string;
  style: RichTextStyle;
}

export interface PositionedSpan {
  x: number;
  y: number;
  text: string;
  style: RichTextStyle;
}

const DEFAULT_STYLE: RichTextStyle = {
  bold: false,
  italic: false,
  strike: false,
  underline: false,
};

function mergeAdjacentSpans(spans: StyledSpan[]): StyledSpan[] {
  const merged: StyledSpan[] = [];
  for (const span of spans) {
    const previous = merged.at(-1);
    if (
      previous &&
      previous.style.bold === span.style.bold &&
      previous.style.italic === span.style.italic &&
      previous.style.underline === span.style.underline &&
      previous.style.strike === span.style.strike
    ) {
      previous.text += span.text;
      continue;
    }
    merged.push({ ...span, style: { ...span.style } });
  }
  return merged;
}

function walkNodes(
  node: Node,
  style: RichTextStyle,
  spans: StyledSpan[],
  blockBreak: boolean
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (text) {
      spans.push({ style: { ...style }, text });
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const nextStyle: RichTextStyle = { ...style };

  if (tag === 'strong' || tag === 'b') {
    nextStyle.bold = true;
  }
  if (tag === 'em' || tag === 'i') {
    nextStyle.italic = true;
  }
  if (tag === 'u') {
    nextStyle.underline = true;
  }
  if (tag === 's' || tag === 'strike' || tag === 'del') {
    nextStyle.strike = true;
  }
  if (tag === 'br') {
    spans.push({ style: { ...DEFAULT_STYLE }, text: '\n' });
    return;
  }

  const isBlock = tag === 'p' || tag === 'div';
  for (const child of element.childNodes) {
    walkNodes(child, nextStyle, spans, false);
  }
  if (isBlock && blockBreak) {
    spans.push({ style: { ...DEFAULT_STYLE }, text: '\n' });
  }
}

export function parseRichTextHtml(html: string): StyledSpan[] {
  if (!html) {
    return [];
  }

  if (typeof document === 'undefined') {
    const plain = html.replaceAll(/<[^>]+>/g, '');
    return plain ? [{ style: DEFAULT_STYLE, text: plain }] : [];
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  const spans: StyledSpan[] = [];
  const children = [...template.content.childNodes];
  for (const [index, child] of children.entries()) {
    walkNodes(child, DEFAULT_STYLE, spans, index < children.length - 1);
  }

  while (spans.at(-1)?.text === '\n') {
    spans.pop();
  }

  return mergeAdjacentSpans(spans);
}

interface WordToken {
  text: string;
  style: RichTextStyle;
}

function tokenize(spans: StyledSpan[]): WordToken[] {
  const tokens: WordToken[] = [];
  for (const span of spans) {
    if (span.text.includes('\n')) {
      const parts = span.text.split('\n');
      for (const [index, part] of parts.entries()) {
        if (part) {
          for (const piece of part.split(/(\s+)/)) {
            if (piece) {
              tokens.push({ style: span.style, text: piece });
            }
          }
        }
        if (index < parts.length - 1) {
          tokens.push({ style: DEFAULT_STYLE, text: '\n' });
        }
      }
      continue;
    }
    for (const piece of span.text.split(/(\s+)/)) {
      if (piece) {
        tokens.push({ style: span.style, text: piece });
      }
    }
  }
  return tokens;
}

export function buildRichTextFont(
  style: RichTextStyle,
  fontSize: number,
  fontFamily: string
): string {
  const weight = style.bold ? 'bold' : 'normal';
  const fontStyle = style.italic ? 'italic' : 'normal';
  return `${fontStyle} ${weight} ${fontSize}px ${fontFamily}`;
}

export function measureRichTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  style: RichTextStyle,
  letterSpacing: number = DEFAULT_RICH_TEXT_LETTER_SPACING
): number {
  if (!text) {
    return 0;
  }

  const letterSpacingWidth = letterSpacing * text.length;

  if (typeof document === 'undefined') {
    return letterSpacingWidth;
  }
  if (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('jsdom')
  ) {
    return (
      text.length * fontSize * (style.bold ? 0.62 : 0.6) + letterSpacingWidth
    );
  }
  const canvas = document.createElement('canvas');
  try {
    const context = canvas.getContext('2d');
    if (!context) {
      return (
        text.length * fontSize * (style.bold ? 0.62 : 0.6) + letterSpacingWidth
      );
    }
    context.font = buildRichTextFont(style, fontSize, fontFamily);
    return context.measureText(text).width + letterSpacingWidth;
  } catch {
    return (
      text.length * fontSize * (style.bold ? 0.62 : 0.6) + letterSpacingWidth
    );
  }
}

function areStylesEqual(left: RichTextStyle, right: RichTextStyle): boolean {
  return (
    left.bold === right.bold &&
    left.italic === right.italic &&
    left.underline === right.underline &&
    left.strike === right.strike
  );
}

function createRichTextMeasurementRoot(options: {
  width: number;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing?: number;
}): HTMLDivElement {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '-100000px';
  root.style.top = '0';
  root.style.visibility = 'hidden';
  root.style.pointerEvents = 'none';
  root.style.boxSizing = 'border-box';
  root.style.width = `${options.width}px`;
  root.style.fontFamily = options.fontFamily;
  root.style.fontSize = `${options.fontSize}px`;
  root.style.lineHeight = `${options.lineHeight}px`;
  root.style.letterSpacing = `${options.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING}px`;
  root.style.textAlign = options.align ?? 'left';
  root.style.whiteSpace = RICH_TEXT_WHITE_SPACE;
  root.style.overflowWrap = RICH_TEXT_OVERFLOW_WRAP;
  root.style.wordBreak = RICH_TEXT_WORD_BREAK;
  return root;
}

function normalizeRichTextMeasurementHtml(root: HTMLElement): void {
  for (const paragraph of root.querySelectorAll('p')) {
    paragraph.style.margin = '0';
  }
}

function getRichTextStyleFromNode(
  node: Node,
  root: HTMLElement
): RichTextStyle {
  const style: RichTextStyle = { ...DEFAULT_STYLE };
  let current: Element | null =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;

  while (current && current !== root) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'strong' || tag === 'b') {
      style.bold = true;
    }
    if (tag === 'em' || tag === 'i') {
      style.italic = true;
    }
    if (tag === 'u') {
      style.underline = true;
    }
    if (tag === 's' || tag === 'strike' || tag === 'del') {
      style.strike = true;
    }
    current = current.parentElement;
  }

  return style;
}

interface CharacterMeasurement {
  right: number;
  style: RichTextStyle;
  text: string;
  x: number;
  y: number;
}

function measureRichTextCharactersFromHtml(
  root: HTMLElement,
  rootRect: DOMRect
): CharacterMeasurement[] | null {
  const measurements: CharacterMeasurement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();

  while (textNode) {
    const content = textNode.textContent ?? '';
    const style = getRichTextStyleFromNode(textNode, root);

    for (let index = 0; index < content.length; index += 1) {
      const character = content[index];
      if (!character || character === '\n') {
        continue;
      }

      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        continue;
      }

      measurements.push({
        right: rect.right - rootRect.left,
        style,
        text: character,
        x: rect.left - rootRect.left,
        y: rect.top - rootRect.top,
      });
    }

    textNode = walker.nextNode();
  }

  return measurements.length > 0 ? measurements : null;
}

function mergeCharacterMeasurements(
  measurements: CharacterMeasurement[]
): PositionedSpan[] {
  const positioned: PositionedSpan[] = [];
  let current:
    | (PositionedSpan & {
        right: number;
      })
    | null = null;

  for (const measurement of measurements) {
    if (
      current &&
      areStylesEqual(current.style, measurement.style) &&
      Math.abs(current.y - measurement.y) < 0.5 &&
      Math.abs(current.right - measurement.x) < 1.5
    ) {
      current.text += measurement.text;
      current.right = measurement.right;
      continue;
    }

    if (current) {
      positioned.push({
        style: current.style,
        text: current.text,
        x: current.x,
        y: current.y,
      });
    }

    current = {
      right: measurement.right,
      style: measurement.style,
      text: measurement.text,
      x: measurement.x,
      y: measurement.y,
    };
  }

  if (current) {
    positioned.push({
      style: current.style,
      text: current.text,
      x: current.x,
      y: current.y,
    });
  }

  return positioned;
}

/** DOM glyph tops include half-leading; Konva adds its own when y starts at 0. */
export function normalizeDomMeasuredSpanY(
  spans: PositionedSpan[]
): PositionedSpan[] {
  if (spans.length === 0) {
    return spans;
  }

  const firstLineY = Math.min(...spans.map((span) => span.y));
  if (firstLineY === 0) {
    return spans;
  }

  return spans.map((span) => ({
    ...span,
    y: span.y - firstLineY,
  }));
}

function mountRichTextMeasurementRoot(
  options: {
    width: number;
    fontSize: number;
    fontFamily: string;
    align?: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing?: number;
  },
  html: string
): HTMLDivElement {
  const root = createRichTextMeasurementRoot(options);
  root.innerHTML = html;
  normalizeRichTextMeasurementHtml(root);
  document.body.append(root);
  return root;
}

function layoutRichTextWithDom(options: {
  html: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing?: number;
}): PositionedSpan[] | null {
  if (!isRichTextDomMeasurementAvailable()) {
    return null;
  }

  if (!options.html.trim()) {
    return [];
  }

  const root = mountRichTextMeasurementRoot(options, options.html);

  try {
    const rootRect = root.getBoundingClientRect();
    const measurements = measureRichTextCharactersFromHtml(root, rootRect);
    if (!measurements) {
      return null;
    }

    return normalizeDomMeasuredSpanY(mergeCharacterMeasurements(measurements));
  } finally {
    root.remove();
  }
}

function layoutRichTextFallback(options: {
  html: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing?: number;
}): PositionedSpan[] {
  const {
    html,
    width,
    fontSize,
    fontFamily,
    align = 'left',
    lineHeight,
    letterSpacing = DEFAULT_RICH_TEXT_LETTER_SPACING,
  } = options;

  const tokens = tokenize(parseRichTextHtml(html));
  const lines: WordToken[][] = [[]];
  let currentLineWidth = 0;

  for (const token of tokens) {
    const currentLine = lines.at(-1);
    if (!currentLine) {
      lines.push([]);
      continue;
    }

    if (token.text === '\n') {
      lines.push([]);
      currentLineWidth = 0;
      continue;
    }

    const tokenWidth = measureRichTextWidth(
      token.text,
      fontSize,
      fontFamily,
      token.style,
      letterSpacing
    );

    if (
      currentLineWidth + tokenWidth > width &&
      currentLine.length > 0 &&
      !/^\s+$/.test(token.text)
    ) {
      lines.push([]);
      currentLineWidth = 0;
    }

    const nextLine = lines.at(-1);
    if (!nextLine) {
      continue;
    }
    nextLine.push(token);
    currentLineWidth += tokenWidth;
  }

  const positioned: PositionedSpan[] = [];
  let y = 0;

  for (const line of lines) {
    if (line.length === 0) {
      y += lineHeight;
      continue;
    }

    const lineWidth = line.reduce(
      (sum, token) =>
        sum +
        measureRichTextWidth(
          token.text,
          fontSize,
          fontFamily,
          token.style,
          letterSpacing
        ),
      0
    );

    let x =
      align === 'center'
        ? Math.max(0, (width - lineWidth) / 2)
        : align === 'right'
          ? Math.max(0, width - lineWidth)
          : 0;

    for (const token of line) {
      positioned.push({
        style: token.style,
        text: token.text,
        x,
        y,
      });
      x += measureRichTextWidth(
        token.text,
        fontSize,
        fontFamily,
        token.style,
        letterSpacing
      );
    }

    y += lineHeight;
  }

  return positioned;
}

function isRichTextDomMeasurementAvailable(): boolean {
  return (
    typeof document !== 'undefined' &&
    !!document.body &&
    !(
      typeof navigator !== 'undefined' &&
      navigator.userAgent.toLowerCase().includes('jsdom')
    )
  );
}

function measureRichTextGlyphHeight(
  text: string,
  fontSize: number,
  fontFamily: string,
  style: RichTextStyle
): number {
  if (!text || typeof document === 'undefined') {
    return fontSize;
  }
  if (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('jsdom')
  ) {
    return fontSize;
  }
  const canvas = document.createElement('canvas');
  try {
    const context = canvas.getContext('2d');
    if (!context) {
      return fontSize;
    }
    context.font = buildRichTextFont(style, fontSize, fontFamily);
    const metrics = context.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent ?? fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent ?? fontSize * 0.2;
    return ascent + descent;
  } catch {
    return fontSize;
  }
}

function measureRichTextHeightWithDom(options: {
  html: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing?: number;
}): number | null {
  if (!isRichTextDomMeasurementAvailable()) {
    return null;
  }

  if (!options.html.trim()) {
    return options.lineHeight;
  }

  const root = mountRichTextMeasurementRoot(options, options.html);

  try {
    const measuredHeight = Math.max(
      root.scrollHeight,
      root.getBoundingClientRect().height
    );
    return measuredHeight > 0 ? measuredHeight : null;
  } finally {
    root.remove();
  }
}

export function measureRichTextHeight(options: {
  html: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
  lineHeightMultiplier?: number;
  letterSpacing?: number;
}): number {
  const lineHeightMultiplier =
    options.lineHeightMultiplier ?? RICH_TEXT_LINE_HEIGHT_MULTIPLIER;
  const letterSpacing =
    options.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;
  const lineHeight = getRichTextLineHeight(
    options.fontSize,
    lineHeightMultiplier
  );
  const spans = layoutRichText({
    align: options.align,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    html: options.html,
    letterSpacing,
    lineHeightMultiplier,
    width: options.width,
  });
  if (spans.length === 0) {
    return lineHeight;
  }

  const maxY = Math.max(...spans.map((span) => span.y));
  const spanLineHeight = Math.max(lineHeight, maxY + lineHeight);

  const konvaSpanHeight = options.fontSize * lineHeightMultiplier;
  let konvaBottom = 0;
  for (const span of spans) {
    const glyphExtent = measureRichTextGlyphHeight(
      span.text,
      options.fontSize,
      options.fontFamily,
      span.style
    );
    konvaBottom = Math.max(
      konvaBottom,
      span.y + Math.max(glyphExtent, konvaSpanHeight)
    );
  }

  const domHeight = measureRichTextHeightWithDom({
    align: options.align,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    html: options.html,
    letterSpacing,
    lineHeight,
    width: options.width,
  });

  return Math.ceil(Math.max(spanLineHeight, konvaBottom, domHeight ?? 0));
}

export function layoutRichText(options: {
  html: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
  lineHeightMultiplier?: number;
  letterSpacing?: number;
}): PositionedSpan[] {
  const {
    html,
    width,
    fontSize,
    fontFamily,
    align = 'left',
    lineHeightMultiplier = RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
    letterSpacing = DEFAULT_RICH_TEXT_LETTER_SPACING,
  } = options;

  const lineHeight = getRichTextLineHeight(fontSize, lineHeightMultiplier);

  if (width <= 0) {
    return [];
  }

  const mirrored = layoutRichTextWithDom({
    align,
    fontFamily,
    fontSize,
    html,
    letterSpacing,
    lineHeight,
    width,
  });
  if (mirrored) {
    return mirrored;
  }

  return layoutRichTextFallback({
    align,
    fontFamily,
    fontSize,
    html,
    letterSpacing,
    lineHeight,
    width,
  });
}

export function toKonvaFontStyle(style: RichTextStyle): string {
  if (style.bold && style.italic) {
    return 'bold italic';
  }
  if (style.bold) {
    return 'bold';
  }
  if (style.italic) {
    return 'italic';
  }
  return 'normal';
}

export function toKonvaTextDecoration(style: RichTextStyle): string {
  const parts: string[] = [];
  if (style.underline) {
    parts.push('underline');
  }
  if (style.strike) {
    parts.push('line-through');
  }
  return parts.join(' ');
}
