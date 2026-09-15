import type { LengthUnit, Page } from '@openenvx/core/schema';
import { toPx } from '@openenvx/core/schema';

export interface PageSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  unit?: LengthUnit;
}

const DEFAULT_DPI = 96;

function preset(
  id: string,
  label: string,
  widthMm: number,
  heightMm: number
): PageSizePreset {
  return {
    id,
    label,
    width: Math.round(toPx(widthMm, 'mm', DEFAULT_DPI)),
    height: Math.round(toPx(heightMm, 'mm', DEFAULT_DPI)),
    unit: 'mm',
  };
}

export const PAGE_SIZE_PRESETS: PageSizePreset[] = [
  preset('a5-portrait', 'A5 Portrait', 148, 210),
  preset('a5-landscape', 'A5 Landscape', 210, 148),
  preset('a4-portrait', 'A4 Portrait', 210, 297),
  preset('a4-landscape', 'A4 Landscape', 297, 210),
  preset('a3-portrait', 'A3 Portrait', 297, 420),
  preset('a3-landscape', 'A3 Landscape', 420, 297),
];

export const DEFAULT_PAGE_SIZE_PRESET = PAGE_SIZE_PRESETS.find(
  (entry) => entry.id === 'a4-portrait'
)!;

export function resolvePagePreset(id: string): PageSizePreset | undefined {
  return PAGE_SIZE_PRESETS.find((entry) => entry.id === id);
}

export function findPresetForPage(page: Page): PageSizePreset | undefined {
  if (page.width === undefined || page.height === undefined) {
    return undefined;
  }
  return PAGE_SIZE_PRESETS.find(
    (entry) => entry.width === page.width && entry.height === page.height
  );
}

export function getDefaultPageDimensions(): { width: number; height: number } {
  return {
    width: DEFAULT_PAGE_SIZE_PRESET.width,
    height: DEFAULT_PAGE_SIZE_PRESET.height,
  };
}
