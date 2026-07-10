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
  /** Latest baked transform used for incremental scale reads. */
  snapshot: Transform;
  /** Immutable drag-start transform; vertical center and fixed horizontal edge anchor here. */
  origin: Transform;
  startFontSize: number;
}

export interface RichTextResizeResult {
  fontSize: number;
  transform: Transform;
}

function toLocalX(
  pointerParent: { x: number; y: number },
  origin: { x: number; y: number },
  rotationDeg: number
): number {
  const dx = pointerParent.x - origin.x;
  const dy = pointerParent.y - origin.y;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return dx * cos + dy * sin;
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

export interface CornerNodeScale {
  height: number;
  scaleX: number;
  scaleY: number;
  width: number;
  x: number;
  y: number;
  rotation: number;
}

function effectiveScaleX(
  node: CornerNodeScale,
  startTransform: Transform
): number {
  const scaleX = Math.abs(node.scaleX);
  if (scaleX !== 1) {
    return scaleX;
  }
  if (startTransform.width <= 0) {
    return 1;
  }
  return node.width / startTransform.width;
}

function effectiveScaleY(
  node: CornerNodeScale,
  startTransform: Transform
): number {
  const scaleY = Math.abs(node.scaleY);
  if (scaleY !== 1) {
    return scaleY;
  }
  if (startTransform.height <= 0) {
    return 1;
  }
  return node.height / startTransform.height;
}

function effectiveUniformScale(
  node: CornerNodeScale,
  startTransform: Transform
): number {
  const scaleX = Math.abs(node.scaleX);
  const scaleY = Math.abs(node.scaleY);
  if (scaleX !== 1 || scaleY !== 1) {
    return (scaleX + scaleY) / 2;
  }
  return (
    (effectiveScaleX(node, startTransform) +
      effectiveScaleY(node, startTransform)) /
    2
  );
}

export function computeCornerResize(
  session: RichTextResizeSession,
  node: CornerNodeScale,
  measureHeight: (width: number, fontSize: number) => number
): RichTextResizeResult {
  const startTransform = session.snapshot;
  const effectiveX = effectiveScaleX(node, startTransform);
  const scale = effectiveUniformScale(node, startTransform);
  const fontSize = Math.max(
    MIN_RICH_TEXT_FONT_SIZE,
    session.startFontSize * scale
  );
  const width = startTransform.width * effectiveX;
  const height = Math.max(MIN_LAYER_SIZE, measureHeight(width, fontSize));
  const roundedFontSize = Math.round(fontSize * 100) / 100;

  return {
    fontSize: roundedFontSize,
    transform: clampTransformSize({
      ...startTransform,
      height,
      rotation: node.rotation,
      width,
      x: node.x,
      y: node.y,
    }),
  };
}
