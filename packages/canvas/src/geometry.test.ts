import { createDefaultTransform } from '@openenvx/core/schema';
import type Konva from "konva";
import { describe, expect, it } from "vitest";

import {
  applyTransformToNode,
  bakeNodeTransform,
  clampAnchorDragPosition,
  clampTransformSize,
  constrainTransformerBox,
  enforceNodeTransformLimits,
  hitTestRotatedLayer,
  isValidNodeTransform,
  MIN_LAYER_SIZE,
  reconcileRotationTransform,
  rotateTransformAroundCenter,
  snapshotNodeState,
} from "./geometry";

type MockGroup = Konva.Group & {
  setScale: (scaleX: number, scaleY: number) => void;
  setPosition: (x: number, y: number) => void;
};

function createMockNode(
  transform: ReturnType<typeof createDefaultTransform>
): MockGroup {
  const state = { ...transform, scaleX: 1, scaleY: 1 };
  return {
    height: () => state.height,
    position: ({ x, y }: { x: number; y: number }) => {
      state.x = x;
      state.y = y;
    },
    rotation: (value?: number) => {
      if (value !== undefined) {
        state.rotation = value;
        return;
      }
      return state.rotation;
    },
    scale: ({ x, y }: { x: number; y: number }) => {
      state.scaleX = x;
      state.scaleY = y;
    },
    scaleX: () => state.scaleX,
    scaleY: () => state.scaleY,
    size: ({ width, height }: { width: number; height: number }) => {
      state.width = width;
      state.height = height;
    },
    width: () => state.width,
    x: () => state.x,
    y: () => state.y,
    setScale(scaleX: number, scaleY: number) {
      state.scaleX = scaleX;
      state.scaleY = scaleY;
    },
    setPosition(x: number, y: number) {
      state.x = x;
      state.y = y;
    },
  } as unknown as MockGroup;
}

describe("geometry", () => {
  it("clampTransformSize enforces minimum and absolute dimensions", () => {
    const transform = {
      ...createDefaultTransform(),
      width: -50,
      height: 2,
    };
    const clamped = clampTransformSize(transform);
    expect(clamped.width).toBe(50);
    expect(clamped.height).toBe(MIN_LAYER_SIZE);
  });

  it("clampAnchorDragPosition blocks bottom-right anchor from crossing top-left", () => {
    const ctx = {
      anchor: "bottom-right",
      fixedCornerAbs: { x: 100, y: 100 },
      rotationRad: 0,
    };

    const clamped = clampAnchorDragPosition(
      { x: 300, y: 200 },
      { x: 50, y: 50 },
      ctx
    );

    expect(clamped).toEqual({
      x: 100 + MIN_LAYER_SIZE,
      y: 100 + MIN_LAYER_SIZE,
    });
  });

  it("clampAnchorDragPosition blocks top-left anchor from crossing bottom-right", () => {
    const ctx = {
      anchor: "top-left",
      fixedCornerAbs: { x: 300, y: 200 },
      rotationRad: 0,
    };

    const clamped = clampAnchorDragPosition(
      { x: 100, y: 100 },
      { x: 350, y: 250 },
      ctx
    );

    expect(clamped).toEqual({
      x: 300 - MIN_LAYER_SIZE,
      y: 200 - MIN_LAYER_SIZE,
    });
  });

  it("constrainTransformerBox blocks flip and sub-minimum resize", () => {
    const oldBox = {
      x: 10,
      y: 20,
      width: 100,
      height: 80,
      rotation: 0,
    };

    expect(
      constrainTransformerBox(oldBox, {
        ...oldBox,
        width: -40,
        x: 70,
      })
    ).toEqual(oldBox);

    expect(
      constrainTransformerBox(oldBox, {
        ...oldBox,
        height: MIN_LAYER_SIZE - 1,
      })
    ).toEqual(oldBox);

    expect(
      constrainTransformerBox(oldBox, {
        ...oldBox,
        width: 120,
        height: 90,
      })
    ).toEqual({
      ...oldBox,
      width: 120,
      height: 90,
    });
  });

  it("isValidNodeTransform rejects flip and sub-minimum size", () => {
    const transform = {
      ...createDefaultTransform(),
      height: 80,
      width: 100,
    };
    const node = createMockNode(transform);

    expect(isValidNodeTransform(node)).toBe(true);

    node.setScale(-1, 1);
    expect(isValidNodeTransform(node)).toBe(false);

    node.setScale(0.05, 1);
    expect(isValidNodeTransform(node)).toBe(false);
  });

  it("enforceNodeTransformLimits snaps back to last valid state", () => {
    const transform = {
      ...createDefaultTransform(),
      height: 80,
      width: 100,
      x: 10,
      y: 20,
    };
    const node = createMockNode(transform);
    const lastValid = snapshotNodeState(node);

    node.setScale(-0.5, 1);
    node.setPosition(60, 20);

    const next = enforceNodeTransformLimits(node, lastValid);

    expect(next).toEqual(lastValid);
    expect(node.x()).toBe(10);
    expect(node.y()).toBe(20);
    expect(node.scaleX()).toBe(1);
    expect(node.scaleY()).toBe(1);
  });

  it("bakeNodeTransform reverts invalid resize without moving element", () => {
    const transform = {
      ...createDefaultTransform(),
      height: 80,
      width: 100,
      x: 10,
      y: 20,
    };
    const node = createMockNode(transform);
    node.setScale(-0.05, 1);
    node.setPosition(95, 20);

    const baked = bakeNodeTransform(transform, node);

    expect(baked).toEqual(transform);
    expect(node.x()).toBe(10);
    expect(node.y()).toBe(20);
    expect(node.width()).toBe(100);
    expect(node.height()).toBe(80);
    expect(node.scaleX()).toBe(1);
    expect(node.scaleY()).toBe(1);
  });

  it("applyTransformToNode syncs node position, size, rotation, and scale", () => {
    const transform = {
      ...createDefaultTransform(),
      height: 80,
      rotation: 15,
      width: 100,
      x: 10,
      y: 20,
    };
    const node = createMockNode(transform);

    node.setScale(1.5, 0.5);
    node.setPosition(99, 101);

    applyTransformToNode(node, {
      ...transform,
      height: 120,
      rotation: 30,
      width: 240,
      x: 40,
      y: 50,
    });

    expect(node.x()).toBe(40);
    expect(node.y()).toBe(50);
    expect(node.width()).toBe(240);
    expect(node.height()).toBe(120);
    expect(node.rotation()).toBe(30);
    expect(node.scaleX()).toBe(1);
    expect(node.scaleY()).toBe(1);
  });

  it("hitTestRotatedLayer detects point inside rotated rect", () => {
    const transform = {
      ...createDefaultTransform(),
      height: 50,
      rotation: 0,
      width: 100,
      x: 100,
      y: 100,
    };
    expect(hitTestRotatedLayer({ x: 120, y: 120 }, transform)).toBeTruthy();
    expect(hitTestRotatedLayer({ x: 0, y: 0 }, transform)).toBeFalsy();
  });

  it("rotateTransformAroundCenter keeps visual center fixed", () => {
    const transform = {
      ...createDefaultTransform(),
      height: 100,
      rotation: 0,
      width: 200,
      x: 100,
      y: 100,
    };

    const next = rotateTransformAroundCenter(transform, 90);

    expect(next.rotation).toBe(90);
    expect(next.x).toBeCloseTo(250);
    expect(next.y).toBeCloseTo(50);

    // Center before: (200, 150). After 90° around center, top-left→(250,50).
    const back = rotateTransformAroundCenter(next, 0);
    expect(back.x).toBeCloseTo(100);
    expect(back.y).toBeCloseTo(100);
    expect(back.rotation).toBe(0);
  });

  it("reconcileRotationTransform pivots when only rotation changes", () => {
    const transform = {
      ...createDefaultTransform(),
      height: 100,
      rotation: 0,
      width: 200,
      x: 100,
      y: 100,
    };

    const next = reconcileRotationTransform(transform, {
      ...transform,
      rotation: 90,
    });

    expect(next.x).toBeCloseTo(250);
    expect(next.y).toBeCloseTo(50);
  });
});

