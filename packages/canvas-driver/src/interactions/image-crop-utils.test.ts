import { describe, expect, it } from 'vitest';

import {
  computeEdgeCropBox,
  computeEdgeCropFromPointer,
  createImageCropSession,
} from './image-crop-utils';

function createSession(
  anchor: 'middle-left' | 'middle-right',
  overrides?: Partial<{
    naturalHeight: number;
    naturalWidth: number;
    originBox: {
      height: number;
      rotation: number;
      width: number;
      x: number;
      y: number;
    };
  }>
) {
  return createImageCropSession({
    anchor,
    naturalHeight: overrides?.naturalHeight ?? 300,
    naturalWidth: overrides?.naturalWidth ?? 400,
    originBox: overrides?.originBox ?? {
      height: 150,
      rotation: 0,
      width: 200,
      x: 100,
      y: 50,
    },
    originCrop: { height: 1, width: 1, x: 0, y: 0 },
    originTransform: {
      height: 150,
      opacity: 1,
      rotation: 0,
      width: 200,
      x: 100,
      y: 50,
    },
  });
}

describe('image crop utils', () => {
  it('crops from the left edge while keeping the right side fixed', () => {
    const session = createSession('middle-left');
    expect(session).not.toBeNull();
    if (!session) {
      return;
    }

    const result = computeEdgeCropBox(session, 150, 150);

    expect(result.crop.x).toBeGreaterThan(0);
    expect(result.crop.width).toBeLessThan(1);
    expect(result.box.width).toBeCloseTo(150, 5);
    expect(result.box.x).toBeCloseTo(150, 5);
    expect(result.box.x + result.box.width).toBeCloseTo(300, 5);
  });

  it('crops from the right edge while keeping the left side fixed', () => {
    const session = createSession('middle-right');
    expect(session).not.toBeNull();
    if (!session) {
      return;
    }

    const result = computeEdgeCropBox(session, 150, 150);

    expect(result.crop.x).toBe(0);
    expect(result.crop.width).toBeLessThan(1);
    expect(result.box.x).toBeCloseTo(100, 5);
    expect(result.box.width).toBeCloseTo(150, 5);
  });

  it('tracks pointer position for right-edge crop without shifting the left edge', () => {
    const session = createSession('middle-right');
    expect(session).not.toBeNull();
    if (!session) {
      return;
    }

    const result = computeEdgeCropFromPointer(session, { x: 250, y: 125 });

    expect(result.box.x).toBeCloseTo(100, 5);
    expect(result.box.width).toBeCloseTo(150, 5);
    expect(result.crop.x).toBe(0);
    expect(result.crop.width).toBeCloseTo(0.75, 5);
  });

  it('tracks pointer position for left-edge crop without shifting the right edge', () => {
    const session = createSession('middle-left');
    expect(session).not.toBeNull();
    if (!session) {
      return;
    }

    const result = computeEdgeCropFromPointer(session, { x: 150, y: 125 });

    expect(result.box.width).toBeCloseTo(150, 5);
    expect(result.box.x).toBeCloseTo(150, 5);
    expect(result.crop.x).toBeGreaterThan(0);
    expect(result.box.x + result.box.width).toBeCloseTo(300, 5);
  });
});
