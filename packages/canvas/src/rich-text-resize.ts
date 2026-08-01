import { clampTransformSize, MIN_LAYER_SIZE } from '@openenvx/core';
import type { Transform } from '@openenvx/schema';

import { constrainTransformerBox } from './geometry';
import type { TransformerBox } from './geometry';

export const RICH_TEXT_CORNER_ANCHORS = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;

export const RICH_TEXT_HORIZONTAL_ANCHORS = [
  'middle-left',
  'middle-right',
] as const;

type RichTextCornerAnchor = (typeof RICH_TEXT_CORNER_ANCHORS)[number];
export type RichTextHorizontalAnchor =
  (typeof RICH_TEXT_HORIZONTAL_ANCHORS)[number];
export type RichTextResizeAnchor =
  | RichTextCornerAnchor
  | RichTextHorizontalAnchor;

export const MIN_RICH_TEXT_FONT_SIZE = 4;

export interface RichTextResizeSession {
  anchor: RichTextResizeAnchor;
  /** Immutable drag-start transform — opposite corner/edge is pinned here. */
  origin: Transform;
  /** Immutable font size at drag start. */
  startFontSize: number;
}

export interface RichTextResizeResult {
  fontSize: number;
  transform: Transform;
}

function toLocalPoint(
  pointerParent: { x: number; y: number },
  origin: { x: number; y: number; rotation: number }
): { x: number; y: number } {
  const dx = pointerParent.x - origin.x;
  const dy = pointerParent.y - origin.y;
  const rotationRad = (origin.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
}

function toLocalX(
  pointerParent: { x: number; y: number },
  origin: { x: number; y: number },
  rotationDeg: number
): number {
  return toLocalPoint(pointerParent, {
    rotation: rotationDeg,
    x: origin.x,
    y: origin.y,
  }).x;
}

function verticalCenterY(origin: Transform): number {
  return origin.y + origin.height / 2;
}

function yFromVerticalCenter(origin: Transform, height: number): number {
  return verticalCenterY(origin) - height / 2;
}

export function computeHorizontalResize(
  session: RichTextResizeSession,
  pointerParent: { x: number; y: number },
  measureHeight: (width: number, fontSize: number) => number
): RichTextResizeResult {
  const origin = session.origin;
  const fontSize = session.startFontSize;
  const localX = toLocalX(
    pointerParent,
    { x: origin.x, y: origin.y },
    origin.rotation
  );

  const width =
    session.anchor === 'middle-right'
      ? Math.max(MIN_LAYER_SIZE, localX)
      : Math.max(MIN_LAYER_SIZE, origin.width - localX);

  const height = Math.max(MIN_LAYER_SIZE, measureHeight(width, fontSize));
  const x =
    session.anchor === 'middle-left'
      ? origin.x + origin.width - width
      : origin.x;

  return {
    fontSize,
    transform: clampTransformSize({
      ...origin,
      height,
      rotation: origin.rotation,
      width,
      x,
      y: yFromVerticalCenter(origin, height),
    }),
  };
}

export function isRichTextHorizontalAnchor(
  anchor: string
): anchor is RichTextHorizontalAnchor {
  return anchor === 'middle-left' || anchor === 'middle-right';
}

export function isRichTextCornerAnchor(
  anchor: string
): anchor is RichTextCornerAnchor {
  return (
    anchor === 'top-left' ||
    anchor === 'top-right' ||
    anchor === 'bottom-left' ||
    anchor === 'bottom-right'
  );
}

export function horizontalResizeBoxFromPointer(
  session: RichTextResizeSession,
  pointerParent: { x: number; y: number },
  measureHeight: (width: number, fontSize: number) => number
): TransformerBox {
  const { transform } = computeHorizontalResize(
    session,
    pointerParent,
    measureHeight
  );

  return {
    height: transform.height,
    rotation: transform.rotation,
    width: transform.width,
    x: transform.x,
    y: transform.y,
  };
}

export function constrainRichTextHorizontalBox(
  session: RichTextResizeSession,
  oldBox: TransformerBox,
  newBox: TransformerBox,
  measureHeight: (width: number, fontSize: number) => number,
  pointerParent?: { x: number; y: number } | null
): TransformerBox {
  if (pointerParent) {
    const box = horizontalResizeBoxFromPointer(
      session,
      pointerParent,
      measureHeight
    );
    if (box.width < MIN_LAYER_SIZE || box.height < MIN_LAYER_SIZE) {
      return constrainTransformerBox(oldBox, newBox);
    }
    return box;
  }

  const width = Math.max(MIN_LAYER_SIZE, newBox.width);
  const height = Math.max(
    MIN_LAYER_SIZE,
    measureHeight(width, session.startFontSize)
  );

  if (width < MIN_LAYER_SIZE || height < MIN_LAYER_SIZE) {
    return constrainTransformerBox(oldBox, newBox);
  }

  const origin = session.origin;
  const x =
    session.anchor === 'middle-left'
      ? origin.x + origin.width - width
      : origin.x;

  return {
    ...newBox,
    height,
    rotation: origin.rotation,
    width,
    x,
    y: yFromVerticalCenter(origin, height),
  };
}

export interface CornerNodeScale {
  height: number;
  scaleX: number;
  scaleY: number;
  width: number;
  x: number;
  y: number;
  rotation: number;
}

export function computeHorizontalResizeFromNode(
  session: RichTextResizeSession,
  node: CornerNodeScale,
  measureHeight: (width: number, fontSize: number) => number
): RichTextResizeResult {
  const origin = session.origin;
  const fontSize = session.startFontSize;
  const width = Math.max(MIN_LAYER_SIZE, node.width * Math.abs(node.scaleX));
  const height = Math.max(MIN_LAYER_SIZE, measureHeight(width, fontSize));
  const x =
    session.anchor === 'middle-left'
      ? origin.x + origin.width - width
      : origin.x;

  return {
    fontSize,
    transform: clampTransformSize({
      ...origin,
      height,
      rotation: node.rotation,
      width,
      x,
      y: yFromVerticalCenter(origin, height),
    }),
  };
}

/**
 * Pin the resized box so the corner opposite `anchor` stays at the drag-start
 * origin (rotation-aware).
 */
export function positionPinnedToOppositeCorner(
  anchor: RichTextResizeAnchor,
  origin: Transform,
  width: number,
  height: number
): { x: number; y: number } {
  const rotationRad = (origin.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  const originOpposite = (() => {
    switch (anchor) {
      case 'top-right': {
        return { x: 0, y: origin.height };
      }
      case 'top-left': {
        return { x: origin.width, y: origin.height };
      }
      case 'bottom-left': {
        return { x: origin.width, y: 0 };
      }
      case 'middle-left': {
        return { x: origin.width, y: origin.height / 2 };
      }
      case 'middle-right': {
        return { x: 0, y: origin.height / 2 };
      }
      default: {
        return { x: 0, y: 0 };
      }
    }
  })();

  const newOpposite = (() => {
    switch (anchor) {
      case 'top-right': {
        return { x: 0, y: height };
      }
      case 'top-left': {
        return { x: width, y: height };
      }
      case 'bottom-left': {
        return { x: width, y: 0 };
      }
      case 'middle-left': {
        return { x: width, y: height / 2 };
      }
      case 'middle-right': {
        return { x: 0, y: height / 2 };
      }
      default: {
        return { x: 0, y: 0 };
      }
    }
  })();

  const fixedAbs = {
    x: origin.x + originOpposite.x * cos - originOpposite.y * sin,
    y: origin.y + originOpposite.x * sin + originOpposite.y * cos,
  };

  return {
    x: fixedAbs.x - (newOpposite.x * cos - newOpposite.y * sin),
    y: fixedAbs.y - (newOpposite.x * sin + newOpposite.y * cos),
  };
}

/**
 * Uniform corner scale from pointer vs drag-start origin.
 * Never reads Konva scale — pointer alone drives size so Transformer cannot fight bake.
 */
export function computeCornerResizeFromPointer(
  session: RichTextResizeSession,
  pointerParent: { x: number; y: number },
  measureHeight: (width: number, fontSize: number) => number
): RichTextResizeResult {
  const origin = session.origin;
  const local = toLocalPoint(pointerParent, origin);

  const scaleX = (() => {
    switch (session.anchor) {
      case 'top-left':
      case 'bottom-left': {
        return (origin.width - local.x) / origin.width;
      }
      default: {
        return local.x / origin.width;
      }
    }
  })();

  const scaleY = (() => {
    switch (session.anchor) {
      case 'top-left':
      case 'top-right': {
        return (origin.height - local.y) / origin.height;
      }
      default: {
        return local.y / origin.height;
      }
    }
  })();

  const rawScale = (Math.max(0, scaleX) + Math.max(0, scaleY)) / 2;
  const minScale = MIN_LAYER_SIZE / Math.max(origin.width, 1);
  const scale = Math.max(minScale, rawScale);

  const fontSize = Math.max(
    MIN_RICH_TEXT_FONT_SIZE,
    Math.round(session.startFontSize * scale * 100) / 100
  );
  const width = Math.max(MIN_LAYER_SIZE, origin.width * scale);
  const height = Math.max(MIN_LAYER_SIZE, measureHeight(width, fontSize));
  const position = positionPinnedToOppositeCorner(
    session.anchor,
    origin,
    width,
    height
  );

  return {
    fontSize,
    transform: clampTransformSize({
      ...origin,
      height,
      rotation: origin.rotation,
      width,
      x: position.x,
      y: position.y,
    }),
  };
}

/** Fallback when pointer is unavailable: treat scaled node size as the scale vs origin. */
export function computeCornerResize(
  session: RichTextResizeSession,
  node: CornerNodeScale,
  measureHeight: (width: number, fontSize: number) => number
): RichTextResizeResult {
  const origin = session.origin;
  const scaledWidth = Math.max(
    MIN_LAYER_SIZE,
    Math.abs(node.width * node.scaleX)
  );
  const scale = scaledWidth / Math.max(origin.width, 1);
  const fontSize = Math.max(
    MIN_RICH_TEXT_FONT_SIZE,
    Math.round(session.startFontSize * scale * 100) / 100
  );
  const width = Math.max(MIN_LAYER_SIZE, origin.width * scale);
  const height = Math.max(MIN_LAYER_SIZE, measureHeight(width, fontSize));
  const position = positionPinnedToOppositeCorner(
    session.anchor,
    origin,
    width,
    height
  );

  return {
    fontSize,
    transform: clampTransformSize({
      ...origin,
      height,
      rotation: origin.rotation,
      width,
      x: position.x,
      y: position.y,
    }),
  };
}

export function cornerResizeBoxFromPointer(
  session: RichTextResizeSession,
  pointerParent: { x: number; y: number },
  measureHeight: (width: number, fontSize: number) => number
): TransformerBox {
  const { transform } = computeCornerResizeFromPointer(
    session,
    pointerParent,
    measureHeight
  );
  return {
    height: transform.height,
    rotation: transform.rotation,
    width: transform.width,
    x: transform.x,
    y: transform.y,
  };
}

export function constrainRichTextCornerBox(
  session: RichTextResizeSession,
  oldBox: TransformerBox,
  newBox: TransformerBox,
  measureHeight: (width: number, fontSize: number) => number,
  pointerParent?: { x: number; y: number } | null
): TransformerBox {
  if (pointerParent) {
    const box = cornerResizeBoxFromPointer(
      session,
      pointerParent,
      measureHeight
    );
    if (box.width < MIN_LAYER_SIZE || box.height < MIN_LAYER_SIZE) {
      return constrainTransformerBox(oldBox, newBox);
    }
    return box;
  }

  // No pointer: derive scale from Konva's proposed width vs origin.
  const scale = Math.max(
    MIN_LAYER_SIZE / Math.max(session.origin.width, 1),
    newBox.width / Math.max(session.origin.width, 1)
  );
  const fontSize = Math.max(
    MIN_RICH_TEXT_FONT_SIZE,
    Math.round(session.startFontSize * scale * 100) / 100
  );
  const width = Math.max(MIN_LAYER_SIZE, session.origin.width * scale);
  const height = Math.max(MIN_LAYER_SIZE, measureHeight(width, fontSize));
  const position = positionPinnedToOppositeCorner(
    session.anchor,
    session.origin,
    width,
    height
  );

  return {
    ...newBox,
    height,
    rotation: session.origin.rotation,
    width,
    x: position.x,
    y: position.y,
  };
}
