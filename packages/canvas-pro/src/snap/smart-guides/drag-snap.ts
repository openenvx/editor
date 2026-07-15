import {
  collectXTargets,
  collectYTargets,
  findBestAxisSnap,
} from './axis-snap';
import { toSnapBounds } from './snap-bounds';
import { computeEqualSpacing } from './spacing-guides';
import type { SnapBounds, SnapResult, SnapTarget } from './types';

export function computeDragSnap(input: {
  artboard: { height: number; width: number };
  marginBounds?: SnapBounds | null;
  moving: SnapTarget;
  others: SnapTarget[];
  threshold: number;
}): SnapResult {
  const { bounds: movingBounds } = input.moving;
  const othersBounds = input.others.map((target) => target.bounds);
  const allBounds = [...othersBounds, movingBounds];

  const xSnap = findBestAxisSnap('x', {
    allBounds,
    artboard: input.artboard,
    moving: movingBounds,
    targets: collectXTargets(input.artboard, othersBounds, input.marginBounds),
    threshold: input.threshold,
  });
  const ySnap = findBestAxisSnap('y', {
    allBounds,
    artboard: input.artboard,
    moving: movingBounds,
    targets: collectYTargets(input.artboard, othersBounds, input.marginBounds),
    threshold: input.threshold,
  });

  let nextX = movingBounds.left + xSnap.delta;
  let nextY = movingBounds.top + ySnap.delta;
  const guides = [];
  if (xSnap.guide) {
    guides.push(xSnap.guide);
  }
  if (ySnap.guide) {
    guides.push(ySnap.guide);
  }

  const spacingResult = computeEqualSpacing(
    {
      bounds: toSnapBounds(
        nextX,
        nextY,
        movingBounds.width,
        movingBounds.height
      ),
      layerType: input.moving.layerType,
    },
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
