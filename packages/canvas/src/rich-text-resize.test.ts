import { createDefaultTransform } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import {
  computeCornerResize,
  computeCornerResizeFromPointer,
  computeHorizontalResize,
  computeHorizontalResizeFromNode,
  constrainRichTextHorizontalBox,
  horizontalResizeBoxFromPointer,
  MIN_RICH_TEXT_FONT_SIZE,
  type RichTextResizeSession,
} from './rich-text-resize';

const snapshot = {
  ...createDefaultTransform(),
  height: 80,
  width: 200,
  x: 10,
  y: 20,
};

describe('computeHorizontalResize', () => {
  const startFontSize = 24;
  const session = (
    anchor: 'middle-left' | 'middle-right'
  ): RichTextResizeSession => ({
    anchor,
    origin: snapshot,
    startFontSize,
  });

  it('keeps top-left fixed when resizing from the right handle', () => {
    const result = computeHorizontalResize(
      session('middle-right'),
      { x: 10 + 300, y: 60 },
      () => 80
    );
    expect(result.fontSize).toBe(24);
    expect(result.transform).toMatchObject({
      height: 80,
      width: 300,
      x: 10,
      y: 20,
    });
  });

  it('keeps top-right fixed when resizing from the left handle', () => {
    const result = computeHorizontalResize(
      session('middle-left'),
      { x: 10 + 50, y: 60 },
      () => 80
    );
    expect(result.transform).toMatchObject({
      height: 80,
      width: 150,
      x: 60,
      y: 20,
    });
  });

  it('grows height from the vertical center when text reflows', () => {
    const result = computeHorizontalResize(
      session('middle-right'),
      { x: 10 + 100, y: 60 },
      () => 120
    );
    expect(result.transform.y).toBe(20 + (80 - 120) / 2);
    expect(result.transform.height).toBe(120);
  });

  it('derives width from pointer for middle-left resize', () => {
    const result = computeHorizontalResize(
      session('middle-left'),
      { x: 60, y: 60 },
      () => 80
    );
    expect(result.transform.width).toBe(150);
    expect(result.transform.x).toBe(60);
  });

  it('projects pointer onto local x axis when rotated', () => {
    const rotated = {
      ...snapshot,
      rotation: 90,
    };
    const result = computeHorizontalResize(
      {
        anchor: 'middle-right',
        origin: rotated,
        startFontSize,
      },
      // 90° CW: local +x is parent -y
      { x: 10, y: 20 + 300 },
      () => 80
    );
    expect(result.transform.width).toBe(300);
  });

  it('narrows width monotonically while keeping vertical center stable', () => {
    const measure = () => 100;
    const a = computeHorizontalResize(
      session('middle-right'),
      { x: 10 + 250, y: 60 },
      measure
    );
    const b = computeHorizontalResize(
      session('middle-right'),
      { x: 10 + 180, y: 60 },
      measure
    );
    expect(b.transform.width).toBeLessThan(a.transform.width);
    expect(a.transform.y + a.transform.height / 2).toBe(
      b.transform.y + b.transform.height / 2
    );
  });
});

describe('computeHorizontalResizeFromNode', () => {
  const startFontSize = 24;
  const session = (
    anchor: 'middle-left' | 'middle-right'
  ): RichTextResizeSession => ({
    anchor,
    origin: snapshot,
    startFontSize,
  });

  it('keeps font size and grows width from the right anchor', () => {
    const result = computeHorizontalResizeFromNode(
      session('middle-right'),
      {
        height: 80,
        rotation: 0,
        scaleX: 1.25,
        scaleY: 1,
        width: 200,
        x: 10,
        y: 20,
      },
      () => 96
    );
    expect(result.fontSize).toBe(startFontSize);
    expect(result.transform.width).toBe(250);
    expect(result.transform.x).toBe(10);
  });

  it('keeps font size and grows width from the left anchor', () => {
    const result = computeHorizontalResizeFromNode(
      session('middle-left'),
      {
        height: 80,
        rotation: 0,
        scaleX: 0.75,
        scaleY: 1,
        width: 200,
        x: 60,
        y: 20,
      },
      () => 80
    );
    expect(result.transform.width).toBe(150);
    expect(result.transform.x).toBe(10 + 200 - 150);
  });

  it('keeps vertical center fixed when height changes from reflow', () => {
    const result = computeHorizontalResizeFromNode(
      session('middle-right'),
      {
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: 200,
        x: 10,
        y: 20,
      },
      () => 120
    );
    expect(result.transform.y).toBe(20 + (80 - 120) / 2);
  });

  it('derives width from node width times scale when scale is already 1', () => {
    const result = computeHorizontalResizeFromNode(
      session('middle-right'),
      {
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: 250,
        x: 10,
        y: 20,
      },
      () => 80
    );
    expect(result.transform.width).toBe(250);
  });
});

describe('constrainRichTextHorizontalBox', () => {
  const startFontSize = 24;
  const session: RichTextResizeSession = {
    anchor: 'middle-right',
    origin: snapshot,
    startFontSize,
  };

  it('uses new box width and measured height centered on origin', () => {
    const box = constrainRichTextHorizontalBox(
      session,
      { height: 80, rotation: 0, width: 200, x: 10, y: 20 },
      { height: 80, rotation: 0, width: 300, x: 10, y: 20 },
      () => 100
    );
    expect(box).toMatchObject({
      height: 100,
      width: 300,
      x: 10,
      y: 20 + (80 - 100) / 2,
    });
  });

  it('pins the right edge when resizing from the left anchor', () => {
    const box = constrainRichTextHorizontalBox(
      { ...session, anchor: 'middle-left' },
      { height: 80, rotation: 0, width: 200, x: 10, y: 20 },
      { height: 80, rotation: 0, width: 150, x: 10, y: 20 },
      () => 80
    );
    expect(box.x).toBe(10 + 200 - 150);
    expect(box.width).toBe(150);
  });

  it('uses pointer position instead of newBox width when pointer is provided', () => {
    const box = constrainRichTextHorizontalBox(
      session,
      { height: 80, rotation: 0, width: 200, x: 10, y: 20 },
      { height: 80, rotation: 0, width: 120, x: 10, y: 20 },
      () => 80,
      { x: 10 + 700, y: 60 }
    );
    expect(box.width).toBe(700);
  });
});

describe('horizontalResizeBoxFromPointer', () => {
  const session: RichTextResizeSession = {
    anchor: 'middle-right',
    origin: snapshot,
    startFontSize: 24,
  };

  it('derives box width from pointer at origin.x + 700', () => {
    const box = horizontalResizeBoxFromPointer(
      session,
      { x: 10 + 700, y: 60 },
      () => 80
    );
    expect(box.width).toBe(700);
  });

  it('tracks mouse not a stale narrow anchor position', () => {
    const fromPointer = horizontalResizeBoxFromPointer(
      session,
      { x: 10 + 700, y: 60 },
      () => 80
    );
    const fromStaleAnchor = horizontalResizeBoxFromPointer(
      session,
      { x: 10 + 335, y: 60 },
      () => 80
    );
    expect(fromPointer.width).toBe(700);
    expect(fromStaleAnchor.width).toBe(335);
    expect(fromPointer.width).toBeGreaterThan(fromStaleAnchor.width);
  });
});

describe('computeCornerResizeFromPointer', () => {
  const startFontSize = 24;
  const baseSession: RichTextResizeSession = {
    anchor: 'bottom-right',
    origin: snapshot,
    startFontSize,
  };

  it('scales uniformly from bottom-right and keeps top-left fixed', () => {
    // Pointer at 1.5× origin size from top-left.
    const result = computeCornerResizeFromPointer(
      baseSession,
      { x: 10 + 300, y: 20 + 120 },
      () => 150
    );
    expect(result.fontSize).toBe(36);
    expect(result.transform.width).toBe(300);
    expect(result.transform.height).toBe(150);
    expect(result.transform.x).toBe(10);
    expect(result.transform.y).toBe(20);
  });

  it('pins bottom-left when resizing from top-right', () => {
    const result = computeCornerResizeFromPointer(
      { ...baseSession, anchor: 'top-right' },
      // local (300, -40) → scaleX=1.5, scaleY=(80-(-40))/80=1.5
      { x: 10 + 300, y: 20 - 40 },
      () => 150
    );
    expect(result.transform.width).toBe(300);
    expect(result.transform.height).toBe(150);
    expect(result.transform.x).toBe(10);
    expect(result.transform.y).toBe(100 - 150);
  });

  it('pins bottom-right when resizing from top-left', () => {
    const result = computeCornerResizeFromPointer(
      { ...baseSession, anchor: 'top-left' },
      { x: 10 - 100, y: 20 - 40 },
      () => 150
    );
    expect(result.transform.width).toBe(300);
    expect(result.transform.height).toBe(150);
    expect(result.transform.x).toBe(10 + 200 - 300);
    expect(result.transform.y).toBe(20 + 80 - 150);
  });

  it('pins top-right when resizing from bottom-left', () => {
    const result = computeCornerResizeFromPointer(
      { ...baseSession, anchor: 'bottom-left' },
      { x: 10 - 100, y: 20 + 120 },
      () => 150
    );
    expect(result.transform.width).toBe(300);
    expect(result.transform.x).toBe(10 + 200 - 300);
    expect(result.transform.y).toBe(20);
  });

  it('clamps font size to the minimum', () => {
    const result = computeCornerResizeFromPointer(
      baseSession,
      { x: 10 + 2, y: 20 + 1 },
      () => 8
    );
    expect(result.fontSize).toBe(MIN_RICH_TEXT_FONT_SIZE);
  });

  it('does not drift opposite corner across repeated calls', () => {
    const measure = (width: number, fontSize: number) =>
      Math.round(fontSize * 4);
    const a = computeCornerResizeFromPointer(
      { ...baseSession, anchor: 'top-right' },
      { x: 10 + 280, y: 20 - 30 },
      measure
    );
    const b = computeCornerResizeFromPointer(
      { ...baseSession, anchor: 'top-right' },
      { x: 10 + 320, y: 20 - 50 },
      measure
    );
    // Bottom-left of origin is (10, 100) — both results must keep it.
    expect(a.transform.x).toBe(10);
    expect(a.transform.y + a.transform.height).toBe(100);
    expect(b.transform.x).toBe(10);
    expect(b.transform.y + b.transform.height).toBe(100);
  });
});

describe('computeCornerResize fallback', () => {
  const startFontSize = 24;
  const baseSession: RichTextResizeSession = {
    anchor: 'bottom-right',
    origin: snapshot,
    startFontSize,
  };

  it('scales from node size vs origin and pins opposite corner', () => {
    const result = computeCornerResize(
      baseSession,
      {
        height: 80,
        rotation: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        width: 200,
        x: 10,
        y: 20,
      },
      () => 150
    );
    expect(result.fontSize).toBe(36);
    expect(result.transform.width).toBe(300);
    expect(result.transform.height).toBe(150);
    expect(result.transform.x).toBe(10);
    expect(result.transform.y).toBe(20);
  });
});
