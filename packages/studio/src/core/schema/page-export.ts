import type { Artboard, LengthUnit } from './types';
import { defaultDpiForUnit, fromPx, toPx } from './units';

export interface ArtboardExportDimensions {
  widthPx: number;
  heightPx: number;
  artboardUnit: LengthUnit;
  artboardDpi: number;
  artboardPresetId?: string;
}

/** @deprecated use ArtboardExportDimensions */
export type PageExportDimensions = ArtboardExportDimensions;

export interface ArtboardExportOptions {
  scale?: number;
  dpi?: number;
}

/** @deprecated use ArtboardExportOptions */
export type PageExportOptions = ArtboardExportOptions;

export function resolveArtboardPresetId(
  artboard: Artboard
): string | undefined {
  return artboard.physical?.presetId;
}

/** @deprecated use resolveArtboardPresetId */
export const resolvePagePresetId = resolveArtboardPresetId;

export function resolveArtboardBackground(artboard: Artboard): string {
  return artboard.background ?? '#ffffff';
}

/** @deprecated use resolveArtboardBackground */
export const resolvePageBackground = resolveArtboardBackground;

export function resolveArtboardDpi(
  artboard: Artboard,
  exportDpi?: number
): number {
  const unit = artboard.physical?.unit ?? 'px';
  return exportDpi ?? artboard.physical?.dpi ?? defaultDpiForUnit(unit);
}

/** @deprecated use resolveArtboardDpi */
export const resolvePageDpi = resolveArtboardDpi;

export function resolveArtboardUnit(artboard: Artboard): LengthUnit {
  return artboard.physical?.unit ?? 'px';
}

/** @deprecated use resolveArtboardUnit */
export const resolvePageUnit = resolveArtboardUnit;

export function resolveArtboardPixelDimensions(artboard: Artboard): {
  width: number;
  height: number;
} {
  const width = artboard.space?.width;
  const height = artboard.space?.height;
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new TypeError(
      `Artboard "${artboard.id}" is missing space width/height (required for export)`
    );
  }
  return { width, height };
}

/** @deprecated use resolveArtboardPixelDimensions */
export const resolvePagePixelDimensions = resolveArtboardPixelDimensions;

export function computeArtboardExportDimensions(
  artboard: Artboard,
  options: ArtboardExportOptions = {}
): ArtboardExportDimensions {
  const { width, height } = resolveArtboardPixelDimensions(artboard);
  const scale = options.scale ?? 1;
  const artboardDpi = resolveArtboardDpi(artboard, options.dpi);
  const artboardUnit = resolveArtboardUnit(artboard);

  return {
    artboardDpi,
    artboardPresetId: resolveArtboardPresetId(artboard),
    artboardUnit,
    heightPx: Math.round(height * scale),
    widthPx: Math.round(width * scale),
  };
}

/** @deprecated use computeArtboardExportDimensions */
export const computePageExportDimensions = computeArtboardExportDimensions;

export function artboardPhysicalSize(
  artboard: Artboard,
  options: ArtboardExportOptions = {}
): { width: number; height: number; unit: LengthUnit } {
  const { width, height } = resolveArtboardPixelDimensions(artboard);
  const unit = resolveArtboardUnit(artboard);
  const dpi = resolveArtboardDpi(artboard, options.dpi);

  if (unit === 'px') {
    return { height, unit, width };
  }

  return {
    height: fromPx(height, unit, dpi),
    unit,
    width: fromPx(width, unit, dpi),
  };
}

/** @deprecated use artboardPhysicalSize */
export const pagePhysicalSize = artboardPhysicalSize;

export function physicalSizeToPixels(
  width: number,
  height: number,
  unit: LengthUnit,
  dpi: number
): { widthPx: number; heightPx: number } {
  return {
    heightPx: Math.round(toPx(height, unit, dpi)),
    widthPx: Math.round(toPx(width, unit, dpi)),
  };
}
