import type { Page } from '@openenvx/schema';
import {
  computePagePrintBoxes,
  resolvePageBleedMm,
  toPx,
} from '@openenvx/schema';

/** Extra space outside the bleed for crop-mark strokes (mm). */
export const CROP_MARK_GUTTER_MM = 10;

/** Gap between mark tip and the bleed edge (mm). */
export const CROP_MARK_GAP_MM = 2;

export interface CropMarkWrapOptions {
  bleedPx: number;
  dpi?: number;
  gutterPx?: number;
  trimHeightPx: number;
  trimWidthPx: number;
}

export interface CropMarkWrapResult {
  heightPx: number;
  svg: string;
  widthPx: number;
}

function mmToPx(mm: number, dpi: number): number {
  return Math.round(toPx(mm, 'mm', dpi));
}

function extractSvgInner(trimSvg: string): string {
  const match = trimSvg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/i);
  if (!match) {
    throw new Error('Expected a root <svg> document to wrap with crop marks');
  }
  return match[1] ?? '';
}

function cropMarkLines(input: {
  bleedPx: number;
  gapPx: number;
  gutterPx: number;
  trimHeightPx: number;
  trimWidthPx: number;
}): string {
  const { bleedPx, gapPx, gutterPx, trimHeightPx, trimWidthPx } = input;
  const offset = gutterPx + bleedPx;
  const trimRight = offset + trimWidthPx;
  const trimBottom = offset + trimHeightPx;
  const markReach = Math.max(gutterPx - gapPx, 1);

  const segments: [number, number, number, number][] = [
    // Top-left
    [offset - bleedPx - markReach, offset, offset - bleedPx - gapPx, offset],
    [offset, offset - bleedPx - markReach, offset, offset - bleedPx - gapPx],
    // Top-right
    [
      trimRight + bleedPx + gapPx,
      offset,
      trimRight + bleedPx + markReach,
      offset,
    ],
    [
      trimRight,
      offset - bleedPx - markReach,
      trimRight,
      offset - bleedPx - gapPx,
    ],
    // Bottom-left
    [
      offset - bleedPx - markReach,
      trimBottom,
      offset - bleedPx - gapPx,
      trimBottom,
    ],
    [
      offset,
      trimBottom + bleedPx + gapPx,
      offset,
      trimBottom + bleedPx + markReach,
    ],
    // Bottom-right
    [
      trimRight + bleedPx + gapPx,
      trimBottom,
      trimRight + bleedPx + markReach,
      trimBottom,
    ],
    [
      trimRight,
      trimBottom + bleedPx + gapPx,
      trimRight,
      trimBottom + bleedPx + markReach,
    ],
  ];

  return segments
    .map(
      ([x1, y1, x2, y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="1" />`
    )
    .join('');
}

/**
 * Wrap a trim-sized SVG in a larger media box with bleed offset + crop marks.
 * No-op when bleedPx <= 0 (returns the original document dimensions).
 */
export function wrapTrimSvgWithCropMarks(
  trimSvg: string,
  options: CropMarkWrapOptions
): CropMarkWrapResult {
  const dpi = options.dpi ?? 96;
  const bleedPx = Math.max(0, Math.round(options.bleedPx));
  if (bleedPx <= 0) {
    return {
      heightPx: options.trimHeightPx,
      svg: trimSvg,
      widthPx: options.trimWidthPx,
    };
  }

  const gutterPx = options.gutterPx ?? mmToPx(CROP_MARK_GUTTER_MM, dpi);
  const gapPx = mmToPx(CROP_MARK_GAP_MM, dpi);
  const offset = gutterPx + bleedPx;
  const widthPx = options.trimWidthPx + offset * 2;
  const heightPx = options.trimHeightPx + offset * 2;
  const inner = extractSvgInner(trimSvg);
  const marks = cropMarkLines({
    bleedPx,
    gapPx,
    gutterPx,
    trimHeightPx: options.trimHeightPx,
    trimWidthPx: options.trimWidthPx,
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}"><rect width="100%" height="100%" fill="#ffffff"/><g transform="translate(${offset} ${offset})">${inner}</g>${marks}</svg>`;

  return { heightPx, svg, widthPx };
}

export function shouldApplyCropMarks(format: string, bleedMm: number): boolean {
  return bleedMm > 0 && (format === 'svg' || format === 'pdf');
}

export function wrapPageExportSvgIfNeeded(
  trimSvg: string,
  page: Page,
  format: string,
  options: { dpi?: number; scale?: number } = {}
): CropMarkWrapResult & { bleedMm: number } {
  const boxes = computePagePrintBoxes(page, { dpi: options.dpi });
  const bleedMm = resolvePageBleedMm(page);
  const scale = options.scale ?? 1;
  const trimWidthPx = Math.round(boxes.trim.width * scale);
  const trimHeightPx = Math.round(boxes.trim.height * scale);
  const bleedPx = Math.round(boxes.bleedPx * scale);

  if (!shouldApplyCropMarks(format, bleedMm)) {
    return {
      bleedMm,
      heightPx: trimHeightPx,
      svg: trimSvg,
      widthPx: trimWidthPx,
    };
  }

  return {
    bleedMm,
    ...wrapTrimSvgWithCropMarks(trimSvg, {
      bleedPx,
      dpi: boxes.dpi,
      trimHeightPx,
      trimWidthPx,
    }),
  };
}
