import { clampTransformSize, MIN_LAYER_SIZE } from '@openenvx/core';
import type { Transform } from '@xmazu/openenvxee-schema';
import type Konva from 'konva';

export { MIN_LAYER_SIZE, clampTransformSize } from '@openenvx/core';

export interface TransformerBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface NodeTransformSnapshot {
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  width: number;
  x: number;
  y: number;
}

export function snapshotNodeState(node: Konva.Group): NodeTransformSnapshot {
  return {
    height: node.height(),
    rotation: node.rotation(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    width: node.width(),
    x: node.x(),
    y: node.y(),
  };
}

export function applyNodeState(
  node: Konva.Group,
  snapshot: NodeTransformSnapshot
): void {
  node.position({ x: snapshot.x, y: snapshot.y });
  node.size({ width: snapshot.width, height: snapshot.height });
  node.scale({ x: snapshot.scaleX, y: snapshot.scaleY });
  node.rotation(snapshot.rotation);
}

export function applyTransformToNode(
  node: Konva.Group,
  transform: Transform
): void {
  node.position({ x: transform.x, y: transform.y });
  node.size({ width: transform.width, height: transform.height });
  node.rotation(transform.rotation);
  node.scale({ x: 1, y: 1 });
}

export function isValidNodeTransform(node: Konva.Group): boolean {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  if (scaleX <= 0 || scaleY <= 0) {
    return false;
  }
  const width = node.width() * scaleX;
  const height = node.height() * scaleY;
  return width >= MIN_LAYER_SIZE && height >= MIN_LAYER_SIZE;
}

export interface TransformDragContext {
  anchor: string;
  fixedCornerAbs: { x: number; y: number };
  rotationRad: number;
}

const OPPOSITE_ANCHOR: Record<string, string> = {
  'bottom-center': 'top-center',
  'bottom-left': 'top-right',
  'bottom-right': 'top-left',
  'middle-left': 'middle-right',
  'middle-right': 'middle-left',
  'top-center': 'bottom-center',
  'top-left': 'bottom-right',
  'top-right': 'bottom-left',
};

function oppositeAnchorLocalPoint(
  opposite: string,
  transform: Transform
): { x: number; y: number } | null {
  const { height, width } = transform;

  switch (opposite) {
    case 'top-left': {
      return { x: 0, y: 0 };
    }
    case 'top-center': {
      return { x: width / 2, y: 0 };
    }
    case 'top-right': {
      return { x: width, y: 0 };
    }
    case 'middle-left': {
      return { x: 0, y: height / 2 };
    }
    case 'middle-right': {
      return { x: width, y: height / 2 };
    }
    case 'bottom-left': {
      return { x: 0, y: height };
    }
    case 'bottom-center': {
      return { x: width / 2, y: height };
    }
    case 'bottom-right': {
      return { x: width, y: height };
    }
    default: {
      return null;
    }
  }
}

export function createTransformDragContextFromOrigin(
  anchor: string,
  origin: Transform,
  node: Konva.Group
): TransformDragContext | null {
  const opposite = OPPOSITE_ANCHOR[anchor];
  if (!opposite) {
    return null;
  }

  const local = oppositeAnchorLocalPoint(opposite, origin);
  if (!local) {
    return null;
  }

  return {
    anchor,
    fixedCornerAbs: node.getAbsoluteTransform().point(local),
    rotationRad: (origin.rotation * Math.PI) / 180,
  };
}

export function createTransformDragContext(
  transformer: Konva.Transformer
): TransformDragContext | null {
  const anchor = transformer.getActiveAnchor();
  if (!anchor || anchor === 'rotater') {
    return null;
  }

  const opposite = OPPOSITE_ANCHOR[anchor];
  if (!opposite) {
    return null;
  }

  const fixedNode = transformer.findOne(`.${opposite}`);
  if (!fixedNode) {
    return null;
  }

  return {
    anchor,
    fixedCornerAbs: fixedNode.getAbsolutePosition(),
    rotationRad: (transformer.rotation() * Math.PI) / 180,
  };
}

function toLocalOffset(
  point: { x: number; y: number },
  origin: { x: number; y: number },
  rotationRad: number
): { x: number; y: number } {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const cos = Math.cos(-rotationRad);
  const sin = Math.sin(-rotationRad);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

function toAbsoluteOffset(
  local: { x: number; y: number },
  origin: { x: number; y: number },
  rotationRad: number
): { x: number; y: number } {
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return {
    x: origin.x + local.x * cos - local.y * sin,
    y: origin.y + local.x * sin + local.y * cos,
  };
}

export function pointerToParentLocal(
  stage: Konva.Stage,
  parent: Konva.Container
): { x: number; y: number } | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }
  return parent.getAbsoluteTransform().copy().invert().point(pointer);
}

export function clampAnchorDragPosition(
  oldAbs: { x: number; y: number },
  newAbs: { x: number; y: number },
  ctx: TransformDragContext
): { x: number; y: number } {
  const local = toLocalOffset(newAbs, ctx.fixedCornerAbs, ctx.rotationRad);
  let { x, y } = local;

  switch (ctx.anchor) {
    case 'bottom-right': {
      x = Math.max(x, MIN_LAYER_SIZE);
      y = Math.max(y, MIN_LAYER_SIZE);
      break;
    }
    case 'top-left': {
      x = Math.min(x, -MIN_LAYER_SIZE);
      y = Math.min(y, -MIN_LAYER_SIZE);
      break;
    }
    case 'bottom-left': {
      x = Math.min(x, -MIN_LAYER_SIZE);
      y = Math.max(y, MIN_LAYER_SIZE);
      break;
    }
    case 'top-right': {
      x = Math.max(x, MIN_LAYER_SIZE);
      y = Math.min(y, -MIN_LAYER_SIZE);
      break;
    }
    case 'middle-right': {
      x = Math.max(x, MIN_LAYER_SIZE);
      y = toLocalOffset(oldAbs, ctx.fixedCornerAbs, ctx.rotationRad).y;
      break;
    }
    case 'middle-left': {
      x = Math.min(x, -MIN_LAYER_SIZE);
      y = toLocalOffset(oldAbs, ctx.fixedCornerAbs, ctx.rotationRad).y;
      break;
    }
    case 'bottom-center': {
      x = toLocalOffset(oldAbs, ctx.fixedCornerAbs, ctx.rotationRad).x;
      y = Math.max(y, MIN_LAYER_SIZE);
      break;
    }
    case 'top-center': {
      x = toLocalOffset(oldAbs, ctx.fixedCornerAbs, ctx.rotationRad).x;
      y = Math.min(y, -MIN_LAYER_SIZE);
      break;
    }
    default: {
      return oldAbs;
    }
  }

  return toAbsoluteOffset({ x, y }, ctx.fixedCornerAbs, ctx.rotationRad);
}

export function normalizeNodeBeforeTransform(node: Konva.Group): void {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  if (scaleX === 1 && scaleY === 1) {
    return;
  }
  node.size({
    width: Math.abs(node.width() * scaleX),
    height: Math.abs(node.height() * scaleY),
  });
  node.scale({ x: 1, y: 1 });
}

export function enforceNodeTransformLimits(
  node: Konva.Group,
  lastValid: NodeTransformSnapshot | null
): NodeTransformSnapshot | null {
  if (isValidNodeTransform(node)) {
    return snapshotNodeState(node);
  }
  if (lastValid) {
    applyNodeState(node, lastValid);
  }
  return lastValid;
}

export function constrainTransformerBox(
  oldBox: TransformerBox,
  newBox: TransformerBox
): TransformerBox {
  if (newBox.width < MIN_LAYER_SIZE || newBox.height < MIN_LAYER_SIZE) {
    return oldBox;
  }
  return newBox;
}

export function bakeNodeTransform(
  transform: Transform,
  node: Konva.Group
): Transform {
  const scaledWidth = Math.abs(node.width() * node.scaleX());
  const scaledHeight = Math.abs(node.height() * node.scaleY());

  if (scaledWidth < MIN_LAYER_SIZE || scaledHeight < MIN_LAYER_SIZE) {
    const clamped = clampTransformSize(transform);
    applyTransformToNode(node, clamped);
    return clamped;
  }

  const baked = clampTransformSize({
    ...transform,
    height: scaledHeight,
    rotation: node.rotation(),
    width: scaledWidth,
    x: node.x(),
    y: node.y(),
  });

  applyTransformToNode(node, baked);

  return baked;
}

export function hitTestRotatedLayer(
  point: { x: number; y: number },
  transform: Transform
): boolean {
  if (transform.rotation === 0) {
    return (
      point.x >= transform.x &&
      point.x <= transform.x + transform.width &&
      point.y >= transform.y &&
      point.y <= transform.y + transform.height
    );
  }

  const cx = transform.x + transform.width / 2;
  const cy = transform.y + transform.height / 2;
  const angle = (-transform.rotation * Math.PI) / 180;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
  return (
    Math.abs(localX) <= transform.width / 2 &&
    Math.abs(localY) <= transform.height / 2
  );
}

export function resizeTransform(
  transform: Transform,
  anchor: 'se' | 'sw' | 'ne' | 'nw',
  dx: number,
  dy: number
): Transform {
  switch (anchor) {
    case 'se': {
      return {
        ...transform,
        width: Math.max(MIN_LAYER_SIZE, transform.width + dx),
        height: Math.max(MIN_LAYER_SIZE, transform.height + dy),
      };
    }
    case 'sw': {
      return {
        ...transform,
        x: transform.x + dx,
        width: Math.max(MIN_LAYER_SIZE, transform.width - dx),
        height: Math.max(MIN_LAYER_SIZE, transform.height + dy),
      };
    }
    case 'ne': {
      return {
        ...transform,
        y: transform.y + dy,
        width: Math.max(MIN_LAYER_SIZE, transform.width + dx),
        height: Math.max(MIN_LAYER_SIZE, transform.height - dy),
      };
    }
    case 'nw': {
      return {
        ...transform,
        x: transform.x + dx,
        y: transform.y + dy,
        width: Math.max(MIN_LAYER_SIZE, transform.width - dx),
        height: Math.max(MIN_LAYER_SIZE, transform.height - dy),
      };
    }
    default: {
      return transform;
    }
  }
}

export { hitTestLayer as hitTestAxisAlignedLayer } from './viewport';
