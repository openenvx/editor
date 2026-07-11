import { filterSameTypeAligned, getCrossAxisAlignment } from './axis-snap';
import { toSnapBounds } from './snap-bounds';
import type { SnapBounds, SnapTarget, SpacingGuide } from './types';

function collectAlignedGaps(
  targets: SnapTarget[],
  axis: 'x' | 'y',
  threshold: number
): number[] {
  const sorted = [...targets].toSorted((a, b) =>
    axis === 'x' ? a.bounds.left - b.bounds.left : a.bounds.top - b.bounds.top
  );
  const gaps: number[] = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index]!;
    const next = sorted[index + 1]!;
    if (
      getCrossAxisAlignment(current.bounds, next.bounds, axis, threshold) ===
      null
    ) {
      continue;
    }
    const gap =
      axis === 'x'
        ? next.bounds.left - current.bounds.right
        : next.bounds.top - current.bounds.bottom;
    if (gap >= 0) {
      gaps.push(gap);
    }
  }
  return gaps;
}

function buildSpacingGuide(
  before: SnapBounds,
  after: SnapBounds,
  axis: 'x' | 'y',
  gap: number,
  cross: number
): SpacingGuide {
  if (axis === 'x') {
    return {
      axis,
      gap: Math.round(gap),
      labelPosition: {
        x: before.right + gap / 2,
        y: cross - 14,
      },
      lineEnd: { x: after.left, y: cross },
      lineStart: { x: before.right, y: cross },
    };
  }
  return {
    axis,
    gap: Math.round(gap),
    labelPosition: {
      x: cross - 14,
      y: before.bottom + gap / 2,
    },
    lineEnd: { x: cross, y: after.top },
    lineStart: { x: cross, y: before.bottom },
  };
}

function collectMatchingSpacingGuides(
  sorted: SnapBounds[],
  targetGap: number,
  axis: 'x' | 'y',
  threshold: number
): SpacingGuide[] {
  const guides: SpacingGuide[] = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const before = sorted[index]!;
    const after = sorted[index + 1]!;
    const cross = getCrossAxisAlignment(before, after, axis, threshold);
    if (cross === null) {
      continue;
    }
    const gap =
      axis === 'x' ? after.left - before.right : after.top - before.bottom;
    if (Math.abs(gap - targetGap) <= threshold) {
      guides.push(buildSpacingGuide(before, after, axis, targetGap, cross));
    }
  }
  return guides;
}

export function computeEqualSpacing(
  moving: SnapTarget,
  others: SnapTarget[],
  threshold: number
): { deltaX: number; deltaY: number; spacing: SpacingGuide[] } {
  const spacing: SpacingGuide[] = [];
  let deltaX = 0;
  let deltaY = 0;

  for (const axis of ['x', 'y'] as const) {
    const aligned = filterSameTypeAligned(moving, others, axis, threshold);
    if (aligned.length === 0) {
      continue;
    }

    const {
      bottom: movingBottom,
      height: movingHeight,
      left: movingLeft,
      right: movingRight,
      top: movingTop,
      width: movingWidth,
    } = moving.bounds;

    const sortedBounds = [
      ...aligned.map((target) => target.bounds),
      moving.bounds,
    ].toSorted((a, b) => (axis === 'x' ? a.left - b.left : a.top - b.top));
    const movingIndex = sortedBounds.indexOf(moving.bounds);
    if (movingIndex === -1) {
      continue;
    }

    const targetGaps = new Set(collectAlignedGaps(aligned, axis, threshold));
    if (movingIndex > 0 && movingIndex < sortedBounds.length - 1) {
      const leftNeighbor = sortedBounds[movingIndex - 1]!;
      const rightNeighbor = sortedBounds[movingIndex + 1]!;
      const innerSpan =
        axis === 'x'
          ? rightNeighbor.left - leftNeighbor.right
          : rightNeighbor.top - leftNeighbor.bottom;
      const movingSize = axis === 'x' ? movingWidth : movingHeight;
      const equalGap = (innerSpan - movingSize) / 2;
      if (equalGap >= 0) {
        targetGaps.add(equalGap);
      }
    }

    const candidates: { delta: number; gap: number }[] = [];

    if (movingIndex > 0) {
      const leftNeighbor = sortedBounds[movingIndex - 1]!;
      const gap =
        axis === 'x'
          ? movingLeft - leftNeighbor.right
          : movingTop - leftNeighbor.bottom;
      for (const targetGap of targetGaps) {
        if (Math.abs(gap - targetGap) <= threshold) {
          const snappedPosition =
            axis === 'x'
              ? leftNeighbor.right + targetGap
              : leftNeighbor.bottom + targetGap;
          candidates.push({
            delta: snappedPosition - (axis === 'x' ? movingLeft : movingTop),
            gap: targetGap,
          });
        }
      }
    }

    if (movingIndex < sortedBounds.length - 1) {
      const rightNeighbor = sortedBounds[movingIndex + 1]!;
      const gap =
        axis === 'x'
          ? rightNeighbor.left - movingRight
          : rightNeighbor.top - movingBottom;
      for (const targetGap of targetGaps) {
        if (Math.abs(gap - targetGap) <= threshold) {
          const snappedPosition =
            axis === 'x'
              ? rightNeighbor.left - targetGap - movingWidth
              : rightNeighbor.top - targetGap - movingHeight;
          candidates.push({
            delta: snappedPosition - (axis === 'x' ? movingLeft : movingTop),
            gap: targetGap,
          });
        }
      }
    }

    if (candidates.length === 0) {
      continue;
    }

    const best = candidates.toSorted(
      (a, b) => Math.abs(a.delta) - Math.abs(b.delta)
    )[0]!;
    if (axis === 'x') {
      deltaX = best.delta;
    } else {
      deltaY = best.delta;
    }

    const snappedMoving = toSnapBounds(
      movingLeft + (axis === 'x' ? best.delta : 0),
      movingTop + (axis === 'y' ? best.delta : 0),
      movingWidth,
      movingHeight
    );
    const snappedSorted = sortedBounds.map((bounds) =>
      bounds === moving.bounds ? snappedMoving : bounds
    );
    spacing.push(
      ...collectMatchingSpacingGuides(snappedSorted, best.gap, axis, threshold)
    );
  }

  return { deltaX, deltaY, spacing };
}
