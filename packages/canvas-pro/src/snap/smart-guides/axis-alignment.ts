import type { SnapBounds, SnapTarget } from './types';

function getCrossAxisValues(bounds: SnapBounds, axis: 'x' | 'y'): number[] {
  return axis === 'x'
    ? [bounds.top, bounds.centerY, bounds.bottom]
    : [bounds.left, bounds.centerX, bounds.right];
}

export function getCrossAxisAlignment(
  a: SnapBounds,
  b: SnapBounds,
  axis: 'x' | 'y',
  threshold: number
): number | null {
  const aValues = getCrossAxisValues(a, axis);
  const bValues = getCrossAxisValues(b, axis);
  for (const aValue of aValues) {
    for (const bValue of bValues) {
      if (Math.abs(aValue - bValue) <= threshold) {
        return (aValue + bValue) / 2;
      }
    }
  }
  return null;
}

export function filterSameTypeAligned(
  moving: SnapTarget,
  others: SnapTarget[],
  axis: 'x' | 'y',
  threshold: number
): SnapTarget[] {
  return others.filter(
    (other) =>
      other.layerType === moving.layerType &&
      getCrossAxisAlignment(moving.bounds, other.bounds, axis, threshold) !==
        null
  );
}
