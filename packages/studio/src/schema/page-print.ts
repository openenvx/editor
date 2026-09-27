import {
  resolveArtboardPixelDimensions,
  resolveArtboardPresetId,
} from './page-export';
import type { Artboard } from './types';
import { toPx } from './units';

export const DEFAULT_BLEED_MM = 3;
export const DEFAULT_SAFE_MM = 10;

export interface ArtboardPrintRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArtboardPrintBoxes {
  bleedMm: number;
  bleedPx: number;
  dpi: number;
  safe: ArtboardPrintRect | null;
  safeMm: number;
  safePx: number;
  trim: { width: number; height: number };
}

export function isPrintEligibleArtboard(artboard: Artboard): boolean {
  if (resolveArtboardPresetId(artboard)) {
    return true;
  }
  const unit = artboard.physical?.unit;
  return unit !== undefined && unit !== 'px';
}

export function resolveArtboardBleedMm(artboard: Artboard): number {
  if (artboard.physical?.bleedMm !== undefined) {
    return artboard.physical.bleedMm;
  }
  return isPrintEligibleArtboard(artboard) ? DEFAULT_BLEED_MM : 0;
}

export function resolveArtboardSafeMm(artboard: Artboard): number {
  if (artboard.physical?.safeMm !== undefined) {
    return artboard.physical.safeMm;
  }
  return isPrintEligibleArtboard(artboard) ? DEFAULT_SAFE_MM : 0;
}

export function computeArtboardPrintBoxes(
  artboard: Artboard,
  options: { dpi?: number } = {}
): ArtboardPrintBoxes {
  const trim = resolveArtboardPixelDimensions(artboard);
  const dpi = options.dpi ?? artboard.physical?.dpi ?? 96;
  const bleedMm = resolveArtboardBleedMm(artboard);
  const safeMm = resolveArtboardSafeMm(artboard);
  const bleedPx = Math.round(toPx(bleedMm, 'mm', dpi));
  const safePx = Math.round(toPx(safeMm, 'mm', dpi));

  let safe: ArtboardPrintRect | null = null;
  if (safePx > 0 && safePx * 2 < trim.width && safePx * 2 < trim.height) {
    safe = {
      height: trim.height - safePx * 2,
      width: trim.width - safePx * 2,
      x: safePx,
      y: safePx,
    };
  }

  return {
    bleedMm,
    bleedPx,
    dpi,
    safe,
    safeMm,
    safePx,
    trim,
  };
}
