import type { Artboard, LengthUnit } from './types';
import { defaultDpiForUnit, fromPx, toPx } from './units';

export interface ArtboardExportDimensions {
  widthPx: number;
  heightPx: number;
  artboardUnit: LengthUnit;
  artboardDpi: number;
  artboardPresetId?: string;
}

export interface ArtboardExportOptions {
  scale?: number;
  dpi?: number;
}

export function resolveArtboardPresetId(
  artboard: Artboard
): string | undefined {
  return artboard.physical?.presetId;
}

export function resolveArtboardBackground(artboard: Artboard): string {
  return artboard.background ?? '#ffffff';
}

export function resolveArtboardDpi(
  artboard: Artboard,
  exportDpi?: number
): number {
  const unit = artboard.physical?.unit ?? 'px';
  return exportDpi ?? artboard.physical?.dpi ?? defaultDpiForUnit(unit);
}

export function resolveArtboardUnit(artboard: Artboard): LengthUnit {
  return artboard.physical?.unit ?? 'px';
}

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
