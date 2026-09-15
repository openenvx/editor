import type { GuideLine, SnapBounds } from './types';

interface AxisSnapInput {
  allBounds: SnapBounds[];
  artboard: { height: number; width: number };
  moving: SnapBounds;
  targets: number[];
  threshold: number;
}

export function collectXTargets(
  artboard: { width: number },
  others: SnapBounds[],
  marginBounds?: SnapBounds | null,
  userGuideXs?: readonly number[]
): number[] {
  const targets = new Set<number>([0, artboard.width / 2, artboard.width]);
  if (marginBounds) {
    targets.add(marginBounds.left);
    targets.add(marginBounds.centerX);
    targets.add(marginBounds.right);
  }
  for (const bounds of others) {
    targets.add(bounds.left);
    targets.add(bounds.centerX);
    targets.add(bounds.right);
  }
  if (userGuideXs) {
    for (const x of userGuideXs) {
      targets.add(x);
    }
  }
  return [...targets];
}

export function collectYTargets(
  artboard: { height: number },
  others: SnapBounds[],
  marginBounds?: SnapBounds | null,
  userGuideYs?: readonly number[]
): number[] {
  const targets = new Set<number>([0, artboard.height / 2, artboard.height]);
  if (marginBounds) {
    targets.add(marginBounds.top);
    targets.add(marginBounds.centerY);
    targets.add(marginBounds.bottom);
  }
  for (const bounds of others) {
    targets.add(bounds.top);
    targets.add(bounds.centerY);
    targets.add(bounds.bottom);
  }
  if (userGuideYs) {
    for (const y of userGuideYs) {
      targets.add(y);
    }
  }
  return [...targets];
}

export function findBestAxisSnap(
  axis: 'x' | 'y',
  input: AxisSnapInput
): { delta: number; guide: GuideLine | null } {
  const edges =
    axis === 'x'
      ? [
          { value: input.moving.left },
          { value: input.moving.centerX },
          { value: input.moving.right },
        ]
      : [
          { value: input.moving.top },
          { value: input.moving.centerY },
          { value: input.moving.bottom },
        ];

  let bestDelta = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestPosition: number | null = null;

  for (const edge of edges) {
    for (const target of input.targets) {
      const delta = target - edge.value;
      const distance = Math.abs(delta);
      if (distance <= input.threshold && distance < bestDistance) {
        bestDistance = distance;
        bestDelta = delta;
        bestPosition = target;
      }
    }
  }

  if (bestPosition === null) {
    return { delta: 0, guide: null };
  }

  const snapPosition = bestPosition;
  const epsilon = input.threshold;
  const aligned = input.allBounds.filter((bounds) => {
    const values =
      axis === 'x'
        ? [bounds.left, bounds.centerX, bounds.right]
        : [bounds.top, bounds.centerY, bounds.bottom];
    return values.some((value) => Math.abs(value - snapPosition) <= epsilon);
  });

  const extentStart = Math.min(...aligned.map((b) => b.top));
  const extentEnd = Math.max(...aligned.map((b) => b.bottom));
  const horizontalStart = Math.min(...aligned.map((b) => b.left));
  const horizontalEnd = Math.max(...aligned.map((b) => b.right));

  const artboardCenter =
    axis === 'x' ? input.artboard.width / 2 : input.artboard.height / 2;
  const isArtboardCenter = Math.abs(snapPosition - artboardCenter) < 0.5;

  const guide: GuideLine =
    axis === 'x'
      ? {
          extent: isArtboardCenter
            ? [0, input.artboard.height]
            : [extentStart, extentEnd],
          fullSpan: isArtboardCenter,
          orientation: 'v',
          position: snapPosition,
        }
      : {
          extent: isArtboardCenter
            ? [0, input.artboard.width]
            : [horizontalStart, horizontalEnd],
          fullSpan: isArtboardCenter,
          orientation: 'h',
          position: snapPosition,
        };

  return { delta: bestDelta, guide };
}

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
  moving: { bounds: SnapBounds; layerType: string },
  others: { bounds: SnapBounds; layerType: string }[],
  axis: 'x' | 'y',
  threshold: number
): { bounds: SnapBounds; layerType: string }[] {
  return others.filter(
    (other) =>
      other.layerType === moving.layerType &&
      getCrossAxisAlignment(moving.bounds, other.bounds, axis, threshold) !==
        null
  );
}
