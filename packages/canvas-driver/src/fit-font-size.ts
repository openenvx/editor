/**
 * Binary-search a font size that fits a fixed-height box.
 * Pure - callers supply their own measure function (canvas DOM, server, etc.).
 */
export function fitFontSize(
  measureHeight: (fontSize: number) => number,
  boxHeight: number,
  minFontSize: number,
  maxFontSize: number
): number {
  const min = Math.max(1, Math.min(minFontSize, maxFontSize));
  const max = Math.max(min, maxFontSize);
  const height = Math.max(0, boxHeight);

  if (measureHeight(max) <= height) {
    return max;
  }
  if (measureHeight(min) > height) {
    return min;
  }

  let low = min;
  let high = max;
  let best = min;
  // Enough iterations for sub-pixel font sizes in common ranges.
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (measureHeight(mid) <= height) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.max(min, Math.min(max, best));
}

export const DEFAULT_MIN_FONT_SIZE = 8;
