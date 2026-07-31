import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from 'vitest';

import { computeCornerResize, computeHorizontalResize, computeHorizontalResizeFromNode, constrainRichTextHorizontalBox, horizontalResizeBoxFromPointer, MIN_RICH_TEXT_FONT_SIZE } from './rich-text-resize';
import type { RichTextResizeSession } from './rich-text-resize';

describe('computeHorizontalResize', () => {
  const snapshot = {
    ...createDefaultTransform(),
    height: 80,
    width: 200,
    x: 10,
    y: 20,
  };
  const startFontSize = 24;

  function session(
    anchor: 'middle-left' | 'middle-right'
  ): RichTextResizeSession {
    return { anchor, origin: snapshot, snapshot, startFontSize };
  }

  it('keeps top-left fixed when resizing from the right handle', () => {
    const result = computeHorizontalResize(
      session('middle-right'),
      { x: 260, y: 60 },
      () => 96
    );

    expect(result.fontSize).toBe(startFontSize);
    expect(result.transform.width).toBe(250);
    expect(result.transform.height).toBe(96);
    expect(result.transform.x).toBe(snapshot.x);
    expect(result.transform.y).toBe(snapshot.y + (snapshot.height - 96) / 2);
  });

  it('keeps top-right fixed when resizing from the left handle', () => {
    const result = computeHorizontalResize(
      session('middle-left'),
      { x: -40, y: 60 },
      () => 96
    );

    expect(result.transform.width).toBe(250);
    expect(result.transform.x).toBe(-40);
    expect(result.transform.y).toBe(snapshot.y + (snapshot.height - 96) / 2);
  });

  it('grows height from the vertical center when text reflows', () => {
    const result = computeHorizontalResize(
      session('middle-right'),
      { x: 150, y: 60 },
      () => 140
    );

    expect(result.transform.width).toBe(140);
    expect(result.transform.height).toBe(140);
    expect(result.transform.x).toBe(snapshot.x);
    expect(result.transform.y).toBe(snapshot.y + (snapshot.height - 140) / 2);
  });

  it('derives width from pointer for middle-left resize', () => {
    const rightX = snapshot.x + snapshot.width;

    const result = computeHorizontalResize(
      session('middle-left'),
      { x: rightX - 150, y: snapshot.y + snapshot.height / 2 },
      () => 96
    );

    expect(result.transform.width).toBe(150);
    expect(result.transform.x).toBe(rightX - 150);
    expect(result.transform.y).toBe(snapshot.y + (snapshot.height - 96) / 2);
  });

  it('projects pointer onto local x axis when rotated', () => {
    const rotatedSnapshot = { ...snapshot, rotation: 90 };
    const result = computeHorizontalResize(
      {
        anchor: 'middle-right',
        origin: rotatedSnapshot,
        snapshot: rotatedSnapshot,
        startFontSize,
      },
      { x: 10, y: 230 },
      () => 100
    );

    expect(result.transform.width).toBe(210);
    expect(result.transform.x).toBe(10);
    expect(result.transform.y).toBe(20 + (80 - 100) / 2);
  });

  it('narrows width monotonically while keeping vertical center stable', () => {
    const measureHeight = (width: number) => {
      if (width > 120) {
        return 80;
      }
      if (width > 80) {
        return 120;
      }
      return 160;
    };
    const pointerXs = [210, 180, 150, 120, 100, 90];
    let previousWidth = Number.POSITIVE_INFINITY;

    for (const pointerX of pointerXs) {
      const result = computeHorizontalResize(
        session('middle-right'),
        { x: pointerX, y: snapshot.y + snapshot.height / 2 },
        measureHeight
      );

      expect(result.transform.width).toBeLessThanOrEqual(previousWidth);
      expect(result.transform.y).toBe(
        snapshot.y + (snapshot.height - result.transform.height) / 2
      );
      previousWidth = result.transform.width;
    }
  });
});

describe('computeHorizontalResizeFromNode', () => {
  const snapshot = {
    ...createDefaultTransform(),
    height: 80,
    width: 200,
    x: 10,
    y: 20,
  };
  const startFontSize = 24;

  it('keeps font size and grows width from the right anchor', () => {
    const result = computeHorizontalResizeFromNode(
      { anchor: 'middle-right', origin: snapshot, snapshot, startFontSize },
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
    expect(result.transform.y).toBe(20 + (80 - 96) / 2);
  });

  it('keeps font size and grows width from the left anchor', () => {
    const result = computeHorizontalResizeFromNode(
      { anchor: 'middle-left', origin: snapshot, snapshot, startFontSize },
      {
        height: 80,
        rotation: 0,
        scaleX: 1.25,
        scaleY: 1,
        width: 200,
        x: -40,
        y: 20,
      },
      () => 96
    );

    expect(result.fontSize).toBe(startFontSize);
    expect(result.transform.width).toBe(250);
    expect(result.transform.x).toBe(-40);
    expect(result.transform.y).toBe(20 + (80 - 96) / 2);
  });

  it('keeps vertical center fixed when height changes from reflow', () => {
    const origin = { ...snapshot, height: 80 };
    const baked = { ...origin, height: 140, width: 140 };

    const result = computeHorizontalResizeFromNode(
      { anchor: 'middle-right', origin, snapshot: baked, startFontSize },
      {
        height: 140,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: 140,
        x: 10,
        y: 35,
      },
      () => 140
    );

    expect(result.transform.y).toBe(origin.y + (origin.height - 140) / 2);
    expect(result.transform.x).toBe(origin.x);
  });

  it('derives width from node width times scale when scale is already 1', () => {
    const result = computeHorizontalResizeFromNode(
      { anchor: 'middle-right', origin: snapshot, snapshot, startFontSize },
      {
        height: 96,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: 250,
        x: 10,
        y: 12,
      },
      () => 96
    );

    expect(result.transform.width).toBe(250);
    expect(result.transform.x).toBe(10);
    expect(result.transform.y).toBe(20 + (80 - 96) / 2);
  });
});

describe('constrainRichTextHorizontalBox', () => {
  const origin = {
    ...createDefaultTransform(),
    height: 80,
    width: 200,
    x: 10,
    y: 20,
  };
  const startFontSize = 24;
  const oldBox = {
    height: 80,
    rotation: 0,
    width: 200,
    x: 10,
    y: 20,
  };

  it('uses new box width and measured height centered on origin', () => {
    const session: RichTextResizeSession = {
      anchor: 'middle-right',
      origin,
      snapshot: origin,
      startFontSize,
    };

    const constrained = constrainRichTextHorizontalBox(
      session,
      oldBox,
      { ...oldBox, width: 140 },
      () => 120
    );

    expect(constrained.width).toBe(140);
    expect(constrained.height).toBe(120);
    expect(constrained.x).toBe(10);
    expect(constrained.y).toBe(20 + (80 - 120) / 2);
  });

  it('pins the right edge when resizing from the left anchor', () => {
    const session: RichTextResizeSession = {
      anchor: 'middle-left',
      origin,
      snapshot: origin,
      startFontSize,
    };

    const constrained = constrainRichTextHorizontalBox(
      session,
      oldBox,
      { ...oldBox, width: 150, x: 60 },
      () => 96
    );

    expect(constrained.width).toBe(150);
    expect(constrained.x).toBe(10 + 200 - 150);
    expect(constrained.y).toBe(20 + (80 - 96) / 2);
  });

  it('uses pointer position instead of newBox width when pointer is provided', () => {
    const wideOrigin = { ...origin, height: 211, width: 714, x: 40, y: 180 };
    const session: RichTextResizeSession = {
      anchor: 'middle-right',
      origin: wideOrigin,
      snapshot: wideOrigin,
      startFontSize: 72,
    };

    const constrained = constrainRichTextHorizontalBox(
      session,
      { ...oldBox, height: 211, width: 714, x: 40, y: 180 },
      { ...oldBox, height: 412, width: 335, x: 40, y: 69 },
      () => 412,
      { x: 40 + 700, y: 180 + 211 / 2 }
    );

    expect(constrained.width).toBe(700);
    expect(constrained.x).toBe(40);
    expect(constrained.y).toBe(180 + (211 - 412) / 2);
  });
});

describe('horizontalResizeBoxFromPointer', () => {
  const origin = {
    ...createDefaultTransform(),
    height: 211,
    width: 714,
    x: 40,
    y: 180,
  };
  const startFontSize = 72;

  it('derives box width from pointer at origin.x + 700', () => {
    const session: RichTextResizeSession = {
      anchor: 'middle-right',
      origin,
      snapshot: origin,
      startFontSize,
    };

    const box = horizontalResizeBoxFromPointer(
      session,
      { x: 40 + 700, y: 180 + 211 / 2 },
      () => 412
    );

    expect(box.width).toBe(700);
    expect(box.height).toBe(412);
    expect(box.x).toBe(40);
    expect(box.y).toBe(180 + (211 - 412) / 2);
  });

  it('tracks mouse not a stale narrow anchor position', () => {
    const session: RichTextResizeSession = {
      anchor: 'middle-right',
      origin,
      snapshot: origin,
      startFontSize,
    };
    const measureHeight = () => 412;
    const pointerAtMouse = { x: 40 + 700, y: 180 + 211 / 2 };
    const staleAnchor = { x: 40 + 335, y: 180 + 211 / 2 };

    const fromPointer = horizontalResizeBoxFromPointer(
      session,
      pointerAtMouse,
      measureHeight
    );
    const fromStaleAnchor = horizontalResizeBoxFromPointer(
      session,
      staleAnchor,
      measureHeight
    );

    expect(fromPointer.width).toBe(700);
    expect(fromStaleAnchor.width).toBe(335);
    expect(fromPointer.width).toBeGreaterThan(fromStaleAnchor.width);
  });
});

describe('computeCornerResize', () => {
  const snapshot = {
    ...createDefaultTransform(),
    height: 80,
    width: 200,
    x: 10,
    y: 20,
  };
  const startFontSize = 24;

  const baseSession: RichTextResizeSession = {
    anchor: 'bottom-right',
    origin: snapshot,
    snapshot,
    startFontSize,
  };

  it('scales font size uniformly when resizing from a corner', () => {
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
  });

  it('clamps font size to the minimum', () => {
    const result = computeCornerResize(
      baseSession,
      {
        height: 80,
        rotation: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        width: 200,
        x: 10,
        y: 20,
      },
      () => 8
    );

    expect(result.fontSize).toBe(MIN_RICH_TEXT_FONT_SIZE);
    expect(result.transform.width).toBe(20);
    expect(result.transform.height).toBe(8);
  });

  it('reads scale from baked node dimensions when scale is already 1', () => {
    const result = computeCornerResize(
      baseSession,
      {
        height: 120,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: 300,
        x: 10,
        y: 20,
      },
      () => 150
    );

    expect(result.fontSize).toBe(36);
    expect(result.transform.width).toBe(300);
    expect(result.transform.height).toBe(150);
  });
});
