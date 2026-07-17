export interface ScrubComputeOptions {
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  pixelsPerStep?: number;
  shiftMultiplier?: number;
  altMultiplier?: number;
}

const DEFAULT_PIXELS_PER_STEP = 1;
const DEFAULT_SHIFT_MULTIPLIER = 10;
const DEFAULT_ALT_MULTIPLIER = 0.1;

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) {
    next = Math.max(min, next);
  }
  if (max !== undefined) {
    next = Math.min(max, next);
  }
  return next;
}

export function roundToPrecision(value: number, precision?: number): number {
  if (precision === undefined) {
    return value;
  }
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function formatNumericDisplay(
  value: number,
  precision?: number
): string {
  return String(roundToPrecision(value, precision));
}

export function computeScrubValue(
  startValue: number,
  deltaPixels: number,
  options: ScrubComputeOptions = {},
  modifiers: { shift?: boolean; alt?: boolean } = {}
): number {
  const step = options.step ?? 1;
  const pixelsPerStep = options.pixelsPerStep ?? DEFAULT_PIXELS_PER_STEP;
  const shiftMultiplier = options.shiftMultiplier ?? DEFAULT_SHIFT_MULTIPLIER;
  const altMultiplier = options.altMultiplier ?? DEFAULT_ALT_MULTIPLIER;

  let multiplier = 1;
  if (modifiers.shift) {
    multiplier *= shiftMultiplier;
  }
  if (modifiers.alt) {
    multiplier *= altMultiplier;
  }

  const delta = (deltaPixels / pixelsPerStep) * step * multiplier;
  const next = roundToPrecision(
    clamp(startValue + delta, options.min, options.max),
    options.precision
  );
  return next;
}
