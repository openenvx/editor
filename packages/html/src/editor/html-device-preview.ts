export type HtmlDevicePreset = 'mobile' | 'desktop' | 'fluid';

export const HTML_DEVICE_WIDTHS: Record<
  Exclude<HtmlDevicePreset, 'fluid'>,
  number
> = {
  mobile: 390,
  /* Wide enough that a ~1024px template shows clear side padding on desktop. */
  desktop: 1600,
};

/** Fit-width at 100% - normal editing size on load. */
export const DEFAULT_HTML_DEVICE_PRESET: HtmlDevicePreset = 'fluid';

/**
 * Zoom factor relative to fit-width (Puck-style).
 * 1 = 100% = entire artboard fits the stage horizontally (never overflows).
 * Absolute CSS scale = zoomFactor * fitZoom.
 */
export const HTML_ZOOM_MIN = 0.25;
export const HTML_ZOOM_MAX = 1;
export const HTML_ZOOM_STEP = 0.1;

/** Fixed zoom choices in the select (fractions of fit-width). */
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
 * Scale so the design frame fits the stage content box horizontally.
 * Returns 1 when the frame already fits. This is the CSS scale at 100% zoom.
 */
export function resolveFitZoom(
  frameWidth: number,
  availableWidth: number
): number {
  if (frameWidth <= 0 || availableWidth <= 0) {
    return 1;
  }
  if (frameWidth <= availableWidth) {
    return 1;
  }
  return availableWidth / frameWidth;
}

export function stepHtmlZoom(zoom: number, direction: 1 | -1): number {
  return clampHtmlZoom(
    Math.round((zoom + direction * HTML_ZOOM_STEP) * 100) / 100
  );
}

/** Label shows the user-facing zoom factor (100% = fit-width). */
export function formatHtmlZoomLabel(zoomFactor: number): string {
  return `${Math.round(zoomFactor * 100)}%`;
}

/** CSS scale applied to the artboard. */
export function resolveEffectiveZoom(
  zoomFactor: number,
  fitZoom: number
): number {
  return clampHtmlZoom(zoomFactor) * fitZoom;
}

/** Layout width after zoom - keeps the scaled frame proportional on the stage. */
export function resolveScaledFrameWidth(
  frameWidth: number,
  zoom: number
): number {
  if (frameWidth <= 0) {
    return 0;
  }
  return frameWidth * zoom;
}
