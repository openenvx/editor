import { clampTextCurve, MAX_TEXT_CURVE } from '@openenvx/schema';
import Konva from 'konva';

import { measurePlainTextWidth } from './rich-text-layout';

export { MAX_TEXT_CURVE };

const CURVE_EPSILON = 0.5;

/** Map UI curve (−MAX…MAX) to path power (−0.9999…0.9999). */
export function curveToPower(curve: number): number {
  return Math.max(
    -0.9999,
    Math.min(0.9999, clampTextCurve(curve) / MAX_TEXT_CURVE)
  );
}

export function isCurvedText(curve: number | undefined | null): boolean {
  return typeof curve === 'number' && Math.abs(curve) >= CURVE_EPSILON;
}

function curveRadius(fontSize: number, power: number): number {
  const p = Math.max(1e-4, Math.abs(power));
  return (5 * Math.max(fontSize, 1)) / (2 * p) - Math.max(fontSize, 1);
}

/**
 * Circular text path.
 *
 * - power > 0 → arch: center pinned, sides drop (text on upper arc)
 * - power < 0 → bowl: sides pinned, center drops (text on lower arc)
 *
 * Draw with Konva `align: 'center'` and `textBaseline: 'middle'`,
 * then shift by `-offsetX/-offsetY` from {@link layoutCurvedText}.
 * Layer `align` is ignored while curved.
 */
export function buildCurvePath(
  width: number,
  height: number,
  power: number,
  fontSize: number
): string {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const safeFont = Math.max(fontSize, 1);
  const p = Math.max(-0.9999, Math.min(0.9999, power));

  if (Math.abs(p) < 1e-4) {
    return `M 0 ${safeHeight / 2} L ${safeWidth} ${safeHeight / 2}`;
  }

  const radius = curveRadius(safeFont, p);
  const midX = safeWidth / 2;

  if (p > 0) {
    const startY = 2 * radius + safeFont / 2;
    return [
      `M ${midX} ${startY}`,
      `A ${radius} ${radius} 0 1 1 ${midX} ${startY - 2 * radius}`,
      `A ${radius} ${radius} 0 1 1 ${midX} ${startY}`,
    ].join(' ');
  }

  const startY = -(2 * radius - Math.round(safeHeight)) - safeFont / 2;
  return [
    `M ${midX} ${startY}`,
    `A ${radius} ${radius} 0 1 0 ${midX} ${startY + 2 * radius}`,
    `A ${radius} ${radius} 0 1 0 ${midX} ${startY}`,
  ].join(' ');
}

export interface CurvedTextLayout {
  path: string;
  width: number;
  height: number;
  /** Subtract when placing TextPath so glyphs sit at (0,0) in the layer box. */
  offsetX: number;
  offsetY: number;
}

/**
 * AABB of text of arc-length `textWidth` on the curve circle.
 * Matches the pin behavior: height grows by the chord sagitta of the occupied arc.
 */
export function estimateCurvedTextBounds(
  textWidth: number,
  fontSize: number,
  power: number
): { width: number; height: number } {
  const safeFont = Math.max(fontSize, 1);
  const p = Math.max(-0.9999, Math.min(0.9999, power));
  if (Math.abs(p) < 1e-4) {
    return {
      height: Math.ceil(safeFont),
      width: Math.ceil(Math.max(textWidth, 1)),
    };
  }

  const radius = curveRadius(safeFont, p);
  const arcLen = Math.max(textWidth, 1);
  const alpha = Math.min(arcLen / radius, Math.PI * 1.999);
  const half = alpha / 2;
  return {
    height: Math.ceil(
      Math.max(safeFont, radius * (1 - Math.cos(half)) + safeFont)
    ),
    width: Math.ceil(Math.max(1, 2 * radius * Math.sin(half))),
  };
}

function measureTextPathRect(options: {
  path: string;
  text: string;
  textWidth: number;
  fontSize: number;
  fontFamily: string;
  letterSpacing: number;
  power: number;
}): { width: number; height: number; offsetX: number; offsetY: number } {
  const fallback = estimateCurvedTextBounds(
    options.textWidth,
    options.fontSize,
    options.power
  );

  if (typeof document === 'undefined') {
    return { ...fallback, offsetX: 0, offsetY: 0 };
  }

  try {
    const node = new Konva.TextPath({
      align: 'center',
      data: options.path,
      fontFamily: options.fontFamily,
      fontSize: options.fontSize,
      letterSpacing: options.letterSpacing,
      text: options.text,
      textBaseline: 'middle',
    });
    const rect = node.getSelfRect();
    node.destroy();
    if (!(rect.width > 0) || !(rect.height > 0)) {
      return { ...fallback, offsetX: 0, offsetY: 0 };
    }
    return {
      height: Math.max(1, rect.height),
      offsetX: rect.x,
      offsetY: rect.y,
      width: Math.max(1, rect.width),
    };
  } catch {
    return { ...fallback, offsetX: 0, offsetY: 0 };
  }
}

/**
 * Path + tight box for curved text.
 *
 * Layout is a pure function of text metrics + curve (seeded from glyph
 * advance + estimated bounds — never the previous box), so remasuring while
 * scrubbing does not walk the box sideways.
 */
export function layoutCurvedText(options: {
  text: string;
  curve: number;
  fontSize: number;
  fontFamily: string;
  letterSpacing?: number;
  textWidth?: number;
}): CurvedTextLayout {
  const fontSize = Math.max(options.fontSize, 1);
  const power = curveToPower(options.curve);
  const letterSpacing = options.letterSpacing ?? 0;
  const text = options.text.length > 0 ? options.text : ' ';
  const textWidth =
    options.textWidth ??
    measurePlainTextWidth(text, fontSize, options.fontFamily, letterSpacing);
  const seedWidth = Math.max(textWidth, 1);
  const seedHeight = Math.max(
    estimateCurvedTextBounds(textWidth, fontSize, power).height,
    fontSize
  );

  if (!isCurvedText(options.curve)) {
    return {
      height: Math.ceil(fontSize),
      offsetX: 0,
      offsetY: 0,
      path: buildCurvePath(seedWidth, seedHeight, 0, fontSize),
      width: Math.ceil(seedWidth),
    };
  }

  const pass = (width: number, height: number): CurvedTextLayout => {
    const path = buildCurvePath(width, height, power, fontSize);
    const rect = measureTextPathRect({
      fontFamily: options.fontFamily,
      fontSize,
      letterSpacing,
      path,
      power,
      text,
      textWidth,
    });
    return {
      height: Math.ceil(rect.height),
      offsetX: rect.offsetX,
      offsetY: rect.offsetY,
      path,
      width: Math.ceil(rect.width),
    };
  };

  const first = pass(seedWidth, seedHeight);
  return pass(first.width, first.height);
}

export function stripHtmlToPlainText(html: string): string {
  return html
    .replaceAll(/<br\s*\/?>/gi, ' ')
    .replaceAll(/<\/p>/gi, ' ')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}
