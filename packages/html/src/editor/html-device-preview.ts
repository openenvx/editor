export type HtmlDevicePreset = 'mobile' | 'tablet' | 'desktop' | 'fluid';

export const HTML_DEVICE_WIDTHS: Record<
  Exclude<HtmlDevicePreset, 'fluid'>,
  number
> = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
};

/** Fit-width at 100% — normal editing size on load. */
export const DEFAULT_HTML_DEVICE_PRESET: HtmlDevicePreset = 'fluid';

export const HTML_ZOOM_MIN = 0.25;
export const HTML_ZOOM_MAX = 2;
export const HTML_ZOOM_STEP = 0.1;

/** Fixed zoom choices in the select (Auto is separate). */
export const HTML_ZOOM_PRESETS = [0.25, 0.5, 1] as const;

export function clampHtmlZoom(zoom: number): number {
  return Math.min(HTML_ZOOM_MAX, Math.max(HTML_ZOOM_MIN, zoom));
}

/**
 * `availableWidth` is the stage content box (CSS padding already applied).
 * Fluid uses that as the design width; fixed presets use device widths.
 */
export function resolveFrameWidth(
  preset: HtmlDevicePreset,
  availableWidth: number
): number {
  if (preset === 'fluid') {
    return Math.max(0, availableWidth);
  }
  return HTML_DEVICE_WIDTHS[preset];
}

/**
 * Scale so the fixed design frame fits the stage content box horizontally.
 * Returns 1 when the frame already fits.
 */
export function resolveAutoZoom(
  frameWidth: number,
  availableWidth: number
): number {
  if (frameWidth <= 0 || availableWidth <= 0) {
    return 1;
  }
  if (frameWidth <= availableWidth) {
    return 1;
  }
  return clampHtmlZoom(availableWidth / frameWidth);
}

export function stepHtmlZoom(zoom: number, direction: 1 | -1): number {
  return clampHtmlZoom(
    Math.round((zoom + direction * HTML_ZOOM_STEP) * 100) / 100
  );
}

export function formatHtmlZoomLabel(zoom: number, auto: boolean): string {
  const percent = Math.round(zoom * 100);
  return auto ? `${percent}% (Auto)` : `${percent}%`;
}

/** Layout width after zoom — keeps the scaled frame proportional on the stage. */
export function resolveScaledFrameWidth(
  frameWidth: number,
  zoom: number
): number {
  if (frameWidth <= 0) {
    return 0;
  }
  return frameWidth * zoom;
}
