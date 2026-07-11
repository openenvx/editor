import { describe, expect, it } from 'vitest';

import { computeDragSnap } from '../snap/smart-guides/drag-snap';
import { computeResizeSnap } from '../snap/smart-guides/resize-snap';
import {
  computeSnapThreshold,
  snapBoundsFromTransform,
  toSnapBounds,
} from '../snap/smart-guides/snap-bounds';
import type { SnapTarget } from '../snap/smart-guides/types';

const RECT = 'canvas.rect';
const TEXT = 'canvas.text';

function snapTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  layerType = RECT
): SnapTarget {
  return {
    bounds: toSnapBounds(x, y, width, height),
    layerType,
  };
}

describe('smart-guides', () => {
  it('snaps center to artboard horizontal center', () => {
    const artboard = { height: 800, width: 600 };
    const result = computeDragSnap({
      artboard,
      moving: snapTarget(248, 100, 100, 100),
      others: [],
      threshold: 10,
    });
    expect(result.x).toBe(250);
    const guide = result.guides.find((entry) => entry.orientation === 'v');
    expect(guide).toBeDefined();
    expect(guide?.fullSpan).toBe(true);
    expect(guide?.extent).toEqual([0, 800]);
  });

  it('snaps left edge to another layer left edge', () => {
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      moving: snapTarget(102, 300, 80, 60),
      others: [snapTarget(100, 200, 80, 60)],
      threshold: 5,
    });
    expect(result.x).toBe(100);
    expect(result.guides.length).toBeGreaterThan(0);
  });

  it('does not snap when outside threshold', () => {
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      moving: snapTarget(145, 300, 80, 60),
      others: [snapTarget(100, 200, 80, 60)],
      threshold: 2,
    });
    expect(result.x).toBe(145);
    expect(result.guides).toHaveLength(0);
  });

  it('detects equal horizontal spacing between three layers', () => {
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      moving: snapTarget(102, 0, 50, 50),
      others: [snapTarget(0, 0, 50, 50), snapTarget(200, 0, 50, 50)],
      threshold: 5,
    });
    expect(result.x).toBe(100);
    expect(result.spacing.some((entry) => entry.axis === 'x')).toBeTruthy();
  });

  it('does not snap spacing to a different layer type', () => {
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      moving: snapTarget(125, 0, 50, 50, RECT),
      others: [snapTarget(0, 0, 50, 50, TEXT), snapTarget(150, 0, 50, 50, TEXT)],
      threshold: 5,
    });
    expect(result.x).toBe(125);
    expect(result.spacing).toHaveLength(0);
  });

  it('does not snap spacing using misaligned same-type layers', () => {
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      moving: snapTarget(125, 0, 50, 50, RECT),
      others: [
        snapTarget(0, 0, 50, 50, RECT),
        snapTarget(150, 200, 50, 50, RECT),
      ],
      threshold: 5,
    });
    expect(result.x).toBe(125);
    expect(result.spacing).toHaveLength(0);
  });

  it('shows matching spacing guides for other aligned same-type neighbors', () => {
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      moving: snapTarget(142, 0, 50, 50, RECT),
      others: [
        snapTarget(0, 0, 50, 50, RECT),
        snapTarget(70, 0, 50, 50, RECT),
        snapTarget(210, 0, 50, 50, RECT),
      ],
      threshold: 5,
    });
    expect(result.x).toBe(140);
    const horizontalGuides = result.spacing.filter((entry) => entry.axis === 'x');
    expect(horizontalGuides).toHaveLength(3);
    expect(horizontalGuides.every((entry) => entry.gap === 20)).toBe(true);
  });

  it('scales threshold inversely with zoom', () => {
    expect(computeSnapThreshold(1)).toBe(5);
    expect(computeSnapThreshold(2)).toBe(2.5);
  });

  it('snaps resize right edge to artboard edge', () => {
    const result = computeResizeSnap({
      anchor: 'middle-right',
      artboard: { height: 800, width: 600 },
      box: {
        height: 100,
        rotation: 0,
        width: 198,
        x: 100,
        y: 100,
      },
      others: [],
      threshold: 5,
    });
    expect(result.box.width).toBe(200);
    expect(result.box.x).toBe(100);
  });

  it('snapBoundsFromTransform maps transform to bounds', () => {
    const bounds = snapBoundsFromTransform({
      height: 80,
      opacity: 1,
      rotation: 0,
      width: 120,
      x: 10,
      y: 20,
    });
    expect(bounds.left).toBe(10);
    expect(bounds.top).toBe(20);
    expect(bounds.right).toBe(130);
    expect(bounds.bottom).toBe(100);
  });
});
