import type { Transform } from '@openenvx/schema';

import { getLayerBounds } from '../align';

export interface SnapBounds {
  bottom: number;
  centerX: number;
  centerY: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

export interface GuideLine {
  extent: [number, number];
  fullSpan?: boolean;
  orientation: 'h' | 'v';
  position: number;
}

export interface SpacingGuide {
  axis: 'x' | 'y';
  gap: number;
  labelPosition: { x: number; y: number };
  lineEnd: { x: number; y: number };
  lineStart: { x: number; y: number };
}

export interface SnapResult {
  guides: GuideLine[];
  spacing: SpacingGuide[];
  x: number;
  y: number;
}

export interface ResizeSnapResult {
  box: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  };
  guides: GuideLine[];
  spacing: SpacingGuide[];
}

export function toSnapBounds(
  x: number,
  y: number,
  width: number,
  height: number
): SnapBounds {
  return {
    bottom: y + height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    height,
    left: x,
    right: x + width,
    top: y,
    width,
  };
}

export function snapBoundsFromTransform(transform: Transform): SnapBounds {
  const bounds = getLayerBounds(transform);
  return toSnapBounds(bounds.x, bounds.y, bounds.width, bounds.height);
}

export function unionSnapBounds(bounds: SnapBounds[]): SnapBounds {
  if (bounds.length === 0) {
    return toSnapBounds(0, 0, 0, 0);
  }
  const left = Math.min(...bounds.map((entry) => entry.left));
  const top = Math.min(...bounds.map((entry) => entry.top));
  const right = Math.max(...bounds.map((entry) => entry.right));
  const bottom = Math.max(...bounds.map((entry) => entry.bottom));
  return toSnapBounds(left, top, right - left, bottom - top);
}

export function computeSnapThreshold(zoom: number): number {
  return 5 / Math.max(zoom, 0.1);
}

interface AxisSnapInput {
  allBounds: SnapBounds[];
  artboard: { height: number; width: number };
  moving: SnapBounds;
  targets: number[];
  threshold: number;
}

function collectXTargets(
  artboard: { width: number },
  others: SnapBounds[],
  marginBounds?: SnapBounds | null
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
  return [...targets];
}

function collectYTargets(
  artboard: { height: number },
  others: SnapBounds[],
  marginBounds?: SnapBounds | null
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
  return [...targets];
}

function findBestAxisSnap(
  axis: 'x' | 'y',
  input: AxisSnapInput
): { delta: number; guide: GuideLine | null } {
  const edges =
    axis === 'x'
      ? [
          { kind: 'left' as const, value: input.moving.left },
          { kind: 'centerX' as const, value: input.moving.centerX },
          { kind: 'right' as const, value: input.moving.right },
        ]
      : [
          { kind: 'top' as const, value: input.moving.top },
          { kind: 'centerY' as const, value: input.moving.centerY },
          { kind: 'bottom' as const, value: input.moving.bottom },
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

function collectExistingGaps(bounds: SnapBounds[], axis: 'x' | 'y'): number[] {
  const sorted = [...bounds].toSorted((a, b) =>
    axis === 'x' ? a.left - b.left : a.top - b.top
  );
  const gaps: number[] = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index]!;
    const next = sorted[index + 1]!;
    const gap =
      axis === 'x' ? next.left - current.right : next.top - current.bottom;
    if (gap >= 0) {
      gaps.push(gap);
    }
  }
  return gaps;
}

function computeEqualSpacing(
  moving: SnapBounds,
  others: SnapBounds[],
  threshold: number
): { deltaX: number; deltaY: number; spacing: SpacingGuide[] } {
  const spacing: SpacingGuide[] = [];
  let deltaX = 0;
  let deltaY = 0;

  for (const axis of ['x', 'y'] as const) {
    const existingGaps = collectExistingGaps(others, axis);
    const sorted = [...others, moving].toSorted((a, b) =>
      axis === 'x' ? a.left - b.left : a.top - b.top
    );
    const movingIndex = sorted.indexOf(moving);
    if (movingIndex === -1) {
      continue;
    }

    const targetGaps = new Set(existingGaps);
    if (movingIndex > 0 && movingIndex < sorted.length - 1) {
      const leftNeighbor = sorted[movingIndex - 1]!;
      const rightNeighbor = sorted[movingIndex + 1]!;
      const innerSpan =
        axis === 'x'
          ? rightNeighbor.left - leftNeighbor.right
          : rightNeighbor.top - leftNeighbor.bottom;
      const movingSize = axis === 'x' ? moving.width : moving.height;
      const equalGap = (innerSpan - movingSize) / 2;
      if (equalGap >= 0) {
        targetGaps.add(equalGap);
      }
    }

    const candidates: {
      delta: number;
      gap: number;
      guide: SpacingGuide;
    }[] = [];

    if (movingIndex > 0) {
      const leftNeighbor = sorted[movingIndex - 1]!;
      const gap =
        axis === 'x'
          ? moving.left - leftNeighbor.right
          : moving.top - leftNeighbor.bottom;
      for (const targetGap of targetGaps) {
        if (Math.abs(gap - targetGap) <= threshold) {
          const snappedPosition =
            axis === 'x'
              ? leftNeighbor.right + targetGap
              : leftNeighbor.bottom + targetGap;
          const cross =
            axis === 'x'
              ? (leftNeighbor.bottom + moving.top) / 2
              : (leftNeighbor.right + moving.left) / 2;
          candidates.push({
            delta: snappedPosition - (axis === 'x' ? moving.left : moving.top),
            gap: targetGap,
            guide:
              axis === 'x'
                ? {
                    axis,
                    gap: Math.round(targetGap),
                    labelPosition: {
                      x: leftNeighbor.right + targetGap / 2,
                      y: cross - 14,
                    },
                    lineEnd: { x: moving.left, y: cross },
                    lineStart: { x: leftNeighbor.right, y: cross },
                  }
                : {
                    axis,
                    gap: Math.round(targetGap),
                    labelPosition: {
                      x: cross - 14,
                      y: leftNeighbor.bottom + targetGap / 2,
                    },
                    lineEnd: { x: cross, y: moving.top },
                    lineStart: { x: cross, y: leftNeighbor.bottom },
                  },
          });
        }
      }
    }

    if (movingIndex < sorted.length - 1) {
      const rightNeighbor = sorted[movingIndex + 1]!;
      const gap =
        axis === 'x'
          ? rightNeighbor.left - moving.right
          : rightNeighbor.top - moving.bottom;
      for (const targetGap of targetGaps) {
        if (Math.abs(gap - targetGap) <= threshold) {
          const snappedPosition =
            axis === 'x'
              ? rightNeighbor.left - targetGap - moving.width
              : rightNeighbor.top - targetGap - moving.height;
          const cross =
            axis === 'x'
              ? (moving.bottom + rightNeighbor.top) / 2
              : (moving.right + rightNeighbor.left) / 2;
          candidates.push({
            delta: snappedPosition - (axis === 'x' ? moving.left : moving.top),
            gap: targetGap,
            guide:
              axis === 'x'
                ? {
                    axis,
                    gap: Math.round(targetGap),
                    labelPosition: {
                      x: moving.right + targetGap / 2,
                      y: cross - 14,
                    },
                    lineEnd: { x: rightNeighbor.left, y: cross },
                    lineStart: { x: moving.right, y: cross },
                  }
                : {
                    axis,
                    gap: Math.round(targetGap),
                    labelPosition: {
                      x: cross - 14,
                      y: moving.bottom + targetGap / 2,
                    },
                    lineEnd: { x: cross, y: rightNeighbor.top },
                    lineStart: { x: cross, y: moving.bottom },
                  },
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
    spacing.push(best.guide);
  }

  return { deltaX, deltaY, spacing };
}

export function computeDragSnap(input: {
  artboard: { height: number; width: number };
  marginBounds?: SnapBounds | null;
  others: SnapBounds[];
  threshold: number;
  width: number;
  x: number;
  y: number;
  height: number;
}): SnapResult {
  const moving = toSnapBounds(input.x, input.y, input.width, input.height);
  const allBounds = [...input.others, moving];

  const xSnap = findBestAxisSnap('x', {
    allBounds,
    artboard: input.artboard,
    moving,
    targets: collectXTargets(input.artboard, input.others, input.marginBounds),
    threshold: input.threshold,
  });
  const ySnap = findBestAxisSnap('y', {
    allBounds,
    artboard: input.artboard,
    moving,
    targets: collectYTargets(input.artboard, input.others, input.marginBounds),
    threshold: input.threshold,
  });

  let nextX = input.x + xSnap.delta;
  let nextY = input.y + ySnap.delta;
  const guides: GuideLine[] = [];
  if (xSnap.guide) {
    guides.push(xSnap.guide);
  }
  if (ySnap.guide) {
    guides.push(ySnap.guide);
  }

  const spacingResult = computeEqualSpacing(
    toSnapBounds(nextX, nextY, input.width, input.height),
    input.others,
    input.threshold
  );
  nextX += spacingResult.deltaX;
  nextY += spacingResult.deltaY;

  return {
    guides,
    spacing: spacingResult.spacing,
    x: nextX,
    y: nextY,
  };
}

const RESIZE_SNAP_ANCHORS: Record<string, { x: boolean; y: boolean }> = {
  'bottom-center': { x: false, y: true },
  'bottom-left': { x: true, y: true },
  'bottom-right': { x: true, y: true },
  'middle-left': { x: true, y: false },
  'middle-right': { x: true, y: false },
  'top-center': { x: false, y: true },
  'top-left': { x: true, y: true },
  'top-right': { x: true, y: true },
};

export function computeResizeSnap(input: {
  anchor: string;
  artboard: { height: number; width: number };
  box: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  };
  marginBounds?: SnapBounds | null;
  others: SnapBounds[];
  threshold: number;
}): ResizeSnapResult {
  const moving = toSnapBounds(
    input.box.x,
    input.box.y,
    input.box.width,
    input.box.height
  );
  const snapAxes = RESIZE_SNAP_ANCHORS[input.anchor] ?? { x: true, y: true };
  const allBounds = [...input.others, moving];
  const guides: GuideLine[] = [];

  let nextBox = { ...input.box };

  if (snapAxes.x) {
    const xSnap = findBestAxisSnap('x', {
      allBounds,
      artboard: input.artboard,
      moving,
      targets: collectXTargets(
        input.artboard,
        input.others,
        input.marginBounds
      ),
      threshold: input.threshold,
    });
    if (xSnap.delta !== 0) {
      if (input.anchor.includes('left')) {
        nextBox = {
          ...nextBox,
          width: nextBox.width - xSnap.delta,
          x: nextBox.x + xSnap.delta,
        };
      } else if (input.anchor.includes('right')) {
        nextBox = { ...nextBox, width: nextBox.width + xSnap.delta };
      } else {
        nextBox = { ...nextBox, x: nextBox.x + xSnap.delta };
      }
      if (xSnap.guide) {
        guides.push(xSnap.guide);
      }
    }
  }

  if (snapAxes.y) {
    const refreshedMoving = toSnapBounds(
      nextBox.x,
      nextBox.y,
      nextBox.width,
      nextBox.height
    );
    const ySnap = findBestAxisSnap('y', {
      allBounds: [...input.others, refreshedMoving],
      artboard: input.artboard,
      moving: refreshedMoving,
      targets: collectYTargets(
        input.artboard,
        input.others,
        input.marginBounds
      ),
      threshold: input.threshold,
    });
    if (ySnap.delta !== 0) {
      if (input.anchor.includes('top')) {
        nextBox = {
          ...nextBox,
          height: nextBox.height - ySnap.delta,
          y: nextBox.y + ySnap.delta,
        };
      } else if (input.anchor.includes('bottom')) {
        nextBox = { ...nextBox, height: nextBox.height + ySnap.delta };
      } else {
        nextBox = { ...nextBox, y: nextBox.y + ySnap.delta };
      }
      if (ySnap.guide) {
        guides.push(ySnap.guide);
      }
    }
  }

  return {
    box: nextBox,
    guides,
    spacing: [],
  };
}
