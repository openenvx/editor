/**
 * Rich-text resize contracts - guards against the conflicts that caused
 * text boxes to jump while dragging corner handles:
 *
 * 1. Pointer (not Konva scaleX/Y) owns live corner size.
 * 2. startFontSize / origin stay immutable for the whole drag.
 * 3. Opposite corner is pinned to drag-start origin after every frame.
 * 4. Baked nodes always land at scale 1 (no leftover Transformer scale).
 */
import { createDefaultTransform } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import { applyTransformToNode } from './geometry';
import {
  computeCornerResizeFromPointer,
  constrainRichTextCornerBox,
  type RichTextResizeSession,
} from './rich-text-resize';

const origin = {
  ...createDefaultTransform(),
  height: 80,
  width: 200,
  x: 40,
  y: 60,
};

const session = (
  anchor: RichTextResizeSession['anchor']
): RichTextResizeSession => ({
  anchor,
  origin,
  startFontSize: 24,
});

const measure = (width: number, fontSize: number) =>
  Math.max(1, Math.round(fontSize * (width / 50)));

function oppositeCorner(
  anchor: RichTextResizeSession['anchor'],
  box: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  switch (anchor) {
    case 'top-right': {
      return { x: box.x, y: box.y + box.height };
    }
    case 'top-left': {
      return { x: box.x + box.width, y: box.y + box.height };
    }
    case 'bottom-left': {
      return { x: box.x + box.width, y: box.y };
    }
    default: {
      return { x: box.x, y: box.y };
    }
  }
}

function originOpposite(
  anchor: RichTextResizeSession['anchor']
): { x: number; y: number } {
  return oppositeCorner(anchor, origin);
}

describe('rich text resize interaction contracts', () => {
  it('corner live path and boundBox path agree for the same pointer', () => {
    const s = session('top-right');
    const pointer = { x: origin.x + 280, y: origin.y - 40 };
    const live = computeCornerResizeFromPointer(s, pointer, measure);
    const box = constrainRichTextCornerBox(
      s,
      {
        height: origin.height,
        rotation: 0,
        width: origin.width,
        x: origin.x,
        y: origin.y,
      },
      {
        height: 999,
        rotation: 0,
        width: 999,
        x: 0,
        y: 0,
      },
      measure,
      pointer
    );

    expect(box).toMatchObject({
      height: live.transform.height,
      width: live.transform.width,
      x: live.transform.x,
      y: live.transform.y,
    });
  });

  it('keeps the opposite corner fixed across a sequence of pointer moves', () => {
    const anchor = 'top-right' as const;
    const s = session(anchor);
    const fixed = originOpposite(anchor);
    const pointers = [
      { x: origin.x + 240, y: origin.y - 20 },
      { x: origin.x + 300, y: origin.y - 50 },
      { x: origin.x + 180, y: origin.y - 10 },
      { x: origin.x + 360, y: origin.y - 80 },
    ];

    for (const pointer of pointers) {
      const result = computeCornerResizeFromPointer(s, pointer, measure);
      const corner = oppositeCorner(anchor, result.transform);
      expect(corner.x).toBeCloseTo(fixed.x, 5);
      expect(corner.y).toBeCloseTo(fixed.y, 5);
    }
  });

  it('does not compound font size when startFontSize stays immutable', () => {
    const s = session('bottom-right');
    // 1.5× then another 1.5× vs the SAME origin/startFontSize → 2.25× total,
    // not 1.5× on top of a mutated startFontSize (which would be 2.25 from
    // wrong baseline compounding if someone passed previous fontSize as start).
    const mid = computeCornerResizeFromPointer(
      s,
      { x: origin.x + origin.width * 1.5, y: origin.y + origin.height * 1.5 },
      () => 120
    );
    expect(mid.fontSize).toBe(36);

    const end = computeCornerResizeFromPointer(
      {
        ...s,
        // CONTRACT: still the original start - never mid.fontSize
        startFontSize: s.startFontSize,
      },
      { x: origin.x + origin.width * 2.25, y: origin.y + origin.height * 2.25 },
      () => 180
    );
    expect(end.fontSize).toBe(54);

    // Wrong pattern (mutation) would yield 36 * 2.25 = 81 here:
    const compoundedWrong = computeCornerResizeFromPointer(
      { ...s, startFontSize: mid.fontSize },
      { x: origin.x + origin.width * 2.25, y: origin.y + origin.height * 2.25 },
      () => 180
    );
    expect(compoundedWrong.fontSize).toBeGreaterThan(end.fontSize);
  });

  it('all corner anchors pin their opposite corner at the origin', () => {
    const anchors = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ] as const;
    const pointerByAnchor: Record<(typeof anchors)[number], { x: number; y: number }> =
      {
        'bottom-left': { x: origin.x - 80, y: origin.y + 140 },
        'bottom-right': { x: origin.x + 320, y: origin.y + 140 },
        'top-left': { x: origin.x - 80, y: origin.y - 40 },
        'top-right': { x: origin.x + 320, y: origin.y - 40 },
      };

    for (const anchor of anchors) {
      const result = computeCornerResizeFromPointer(
        session(anchor),
        pointerByAnchor[anchor],
        measure
      );
      const fixed = originOpposite(anchor);
      const corner = oppositeCorner(anchor, result.transform);
      expect(corner.x).toBeCloseTo(fixed.x, 5);
      expect(corner.y).toBeCloseTo(fixed.y, 5);
    }
  });

  it('applyTransformToNode always clears Konva scale (no leftover Transformer scale)', () => {
    const nodeState = {
      height: 80,
      rotation: 0,
      scaleX: 1.7,
      scaleY: 1.7,
      width: 200,
      x: 40,
      y: 60,
    };
    const node = {
      height: () => nodeState.height,
      position: ({ x, y }: { x: number; y: number }) => {
        nodeState.x = x;
        nodeState.y = y;
      },
      rotation: (value?: number) => {
        if (value !== undefined) {
          nodeState.rotation = value;
        }
        return nodeState.rotation;
      },
      scale: ({ x, y }: { x: number; y: number }) => {
        nodeState.scaleX = x;
        nodeState.scaleY = y;
      },
      scaleX: () => nodeState.scaleX,
      scaleY: () => nodeState.scaleY,
      size: ({ width, height }: { width: number; height: number }) => {
        nodeState.width = width;
        nodeState.height = height;
      },
      width: () => nodeState.width,
      x: () => nodeState.x,
      y: () => nodeState.y,
    };

    applyTransformToNode(node as never, {
      ...origin,
      height: 150,
      width: 300,
      x: 40,
      y: 60,
    });

    expect(node.scaleX()).toBe(1);
    expect(node.scaleY()).toBe(1);
    expect(node.width()).toBe(300);
    expect(node.height()).toBe(150);
  });
});
