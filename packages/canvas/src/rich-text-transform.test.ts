import { createDefaultTransform } from '@openenvx/schema';
import type Konva from 'konva';
import { describe, expect, it } from 'vitest';

import {
  bakeRichTextNodeTransform,
  MIN_RICH_TEXT_FONT_SIZE,
} from './rich-text-transform';

type MockGroup = Konva.Group & {
  setScale: (scaleX: number, scaleY: number) => void;
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
    setScale(scaleX: number, scaleY: number) {
      state.scaleX = scaleX;
      state.scaleY = scaleY;
    },
    width: () => state.width,
    x: () => state.x,
    y: () => state.y,
  } as unknown as MockGroup;
}

describe('bakeRichTextNodeTransform', () => {
  const snapshot = {
    ...createDefaultTransform(),
    height: 80,
    width: 200,
    x: 10,
    y: 20,
  };
  const startFontSize = 24;

  const session = {
    anchor: 'bottom-right' as const,
    origin: snapshot,
    snapshot,
    startFontSize,
  };

  it('scales font size uniformly when resizing from a corner', () => {
    const node = createMockNode(snapshot);
    node.setScale(1.5, 1.5);

    const result = bakeRichTextNodeTransform(session, node, () => 150);

    expect(result.fontSize).toBe(36);
    expect(result.transform.width).toBe(300);
    expect(result.transform.height).toBe(150);
    expect(node.scaleX()).toBe(1);
    expect(node.scaleY()).toBe(1);
  });

  it('clamps font size to the minimum', () => {
    const node = createMockNode(snapshot);
    node.setScale(0.1, 0.1);

    const result = bakeRichTextNodeTransform(session, node, () => 8);

    expect(result.fontSize).toBe(MIN_RICH_TEXT_FONT_SIZE);
    expect(result.transform.width).toBe(20);
    expect(result.transform.height).toBe(8);
  });

  it('reads scale from baked node dimensions when scale is already 1', () => {
    const scaledNode = {
      ...createMockNode(snapshot),
      height: () => 120,
      scaleX: () => 1,
      scaleY: () => 1,
      width: () => 300,
    } as unknown as MockGroup;

    const result = bakeRichTextNodeTransform(session, scaledNode, () => 150);

    expect(result.fontSize).toBe(36);
    expect(result.transform.width).toBe(300);
    expect(result.transform.height).toBe(150);
  });

  it('keeps font size when resizing horizontally from the right', () => {
    const node = createMockNode(snapshot);
    node.setScale(1.25, 1);

    const result = bakeRichTextNodeTransform(
      {
        anchor: 'middle-right',
        origin: snapshot,
        snapshot,
        startFontSize,
      },
      node,
      () => 96
    );

    expect(result.fontSize).toBe(startFontSize);
    expect(result.transform.width).toBe(250);
    expect(result.transform.x).toBe(10);
    expect(result.transform.y).toBe(20 + (80 - 96) / 2);
  });
});
