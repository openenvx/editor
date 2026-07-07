import {
  findPresetForPage,
  getDefaultPageDimensions,
  resolvePagePreset,
} from './page-presets';
import type { LengthUnit, Page } from './types';
import { defaultDpiForUnit, fromPx, toPx } from './units';

export interface PageExportDimensions {
  widthPx: number;
  heightPx: number;
  pageUnit: LengthUnit;
  pageDpi: number;
  pagePresetId?: string;
}

export interface PageExportOptions {
  scale?: number;
  dpi?: number;
}

export function resolvePagePresetId(page: Page): string | undefined {
  if (page.presetId) {
    return page.presetId;
  }
  return findPresetForPage(page)?.id;
}

export function resolvePageBackground(page: Page): string {
  return page.backgroundColor ?? '#ffffff';
}

export function resolvePageDpi(page: Page, exportDpi?: number): number {
  return exportDpi ?? page.dpi ?? defaultDpiForUnit(page.unit ?? 'px');
}

export function resolvePageUnit(page: Page): LengthUnit {
  if (page.unit) {
    return page.unit;
  }
  const presetId = resolvePagePresetId(page);
  if (presetId) {
    const preset = resolvePagePreset(presetId);
    if (preset?.unit) {
      return preset.unit;
    }
  }
  return 'px';
}

export function resolvePagePixelDimensions(page: Page): {
  width: number;
  height: number;
} {
  const defaults = getDefaultPageDimensions();
  return {
    width: page.width ?? defaults.width,
    height: page.height ?? defaults.height,
  };
}

export function computePageExportDimensions(
  page: Page,
  options: PageExportOptions = {}
): PageExportDimensions {
  const { width, height } = resolvePagePixelDimensions(page);
  const scale = options.scale ?? 1;
  const pageDpi = resolvePageDpi(page, options.dpi);
  const pageUnit = resolvePageUnit(page);

  return {
    heightPx: Math.round(height * scale),
    pageDpi,
    pagePresetId: resolvePagePresetId(page),
    pageUnit,
    widthPx: Math.round(width * scale),
  };
}

export function pagePhysicalSize(
  page: Page,
  options: PageExportOptions = {}
): { width: number; height: number; unit: LengthUnit } {
  const { width, height } = resolvePagePixelDimensions(page);
  const unit = resolvePageUnit(page);
  const dpi = resolvePageDpi(page, options.dpi);

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
