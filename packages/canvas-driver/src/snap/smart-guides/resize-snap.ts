import {
  collectXTargets,
  collectYTargets,
  findBestAxisSnap,
} from './axis-snap';
import { toSnapBounds } from './snap-bounds';
import type { ResizeSnapResult, SnapBounds } from './types';

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
  userGuides?: { xs: number[]; ys: number[] } | null;
}): ResizeSnapResult {
  const moving = toSnapBounds(
    input.box.x,
    input.box.y,
    input.box.width,
    input.box.height
  );
  const snapAxes = RESIZE_SNAP_ANCHORS[input.anchor] ?? { x: true, y: true };
  const allBounds = [...input.others, moving];
  const guides: ResizeSnapResult['guides'] = [];

  let nextBox = { ...input.box };

  if (snapAxes.x) {
    const xSnap = findBestAxisSnap('x', {
      allBounds,
      artboard: input.artboard,
      moving,
      targets: collectXTargets(
        input.artboard,
        input.others,
        input.marginBounds,
        input.userGuides?.xs
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
        input.marginBounds,
        input.userGuides?.ys
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
