import {
  type CanvasTransformBox,
  isImageEdgeAnchor,
  type ImageEdgeAnchor,
} from '@openenvx/canvas';
import { MIN_LAYER_SIZE } from '@openenvx/core';
import type { Transform } from '@xmazu/openenvxee-schema';

import {
  clampNormalizedCrop,
  resolveNormalizedCrop,
  type NormalizedCrop,
} from '../crop/normalized-crop';

export interface FullImageLayout {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface ImageCropSession {
  anchor: ImageEdgeAnchor;
  fullImageLayout: FullImageLayout;
  naturalHeight: number;
  naturalWidth: number;
  originBox: CanvasTransformBox;
  originCrop: NormalizedCrop;
  originTransform: Transform;
  previewBox: CanvasTransformBox;
  previewCrop: NormalizedCrop;
  scaleX: number;
  scaleY: number;
}

export function computeFullImageLayout(
  originBox: CanvasTransformBox,
  originCrop: NormalizedCrop
): FullImageLayout {
  const width = originBox.width / originCrop.width;
  const height = originBox.height / originCrop.height;
  return {
    height,
    width,
    x: originBox.x - originCrop.x * width,
    y: originBox.y - originCrop.y * height,
  };
}

export function createImageCropSession(input: {
  anchor: string;
  naturalHeight: number;
  naturalWidth: number;
  originBox: CanvasTransformBox;
  originCrop?: NormalizedCrop;
  originTransform: Transform;
}): ImageCropSession | null {
  if (!isImageEdgeAnchor(input.anchor)) {
    return null;
  }
  if (input.naturalWidth <= 0 || input.naturalHeight <= 0) {
    return null;
  }

  const originCrop = resolveNormalizedCrop(input.originCrop);
  const scaleX =
    input.originTransform.width / (originCrop.width * input.naturalWidth);
  const scaleY =
    input.originTransform.height / (originCrop.height * input.naturalHeight);

  return {
    anchor: input.anchor,
    fullImageLayout: computeFullImageLayout(input.originBox, originCrop),
    naturalHeight: input.naturalHeight,
    naturalWidth: input.naturalWidth,
    originBox: input.originBox,
    originCrop,
    originTransform: input.originTransform,
    previewBox: input.originBox,
    previewCrop: originCrop,
    scaleX,
    scaleY,
  };
}

function toLocalPoint(
  pointerParent: { x: number; y: number },
  origin: { x: number; y: number },
  rotationDeg: number
): { x: number; y: number } {
  const dx = pointerParent.x - origin.x;
  const dy = pointerParent.y - origin.y;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
}

function cropFromRightEdge(
  session: ImageCropSession,
  newWidth: number
): NormalizedCrop {
  const maxWidth = 1 - session.originCrop.x;
  let nextWidth = newWidth / (session.scaleX * session.naturalWidth);
  nextWidth = Math.max(0.001, Math.min(maxWidth, nextWidth));

  return clampNormalizedCrop({
    height: session.originCrop.height,
    width: nextWidth,
    x: session.originCrop.x,
    y: session.originCrop.y,
  });
}

function cropFromLeftEdge(
  session: ImageCropSession,
  newWidth: number
): NormalizedCrop {
  const cropRight = session.originCrop.x + session.originCrop.width;
  let nextWidth = newWidth / (session.scaleX * session.naturalWidth);
  let nextX = cropRight - nextWidth;

  if (nextX < 0) {
    nextX = 0;
    nextWidth = cropRight;
  }

  return clampNormalizedCrop({
    height: session.originCrop.height,
    width: nextWidth,
    x: nextX,
    y: session.originCrop.y,
  });
}

function cropFromBottomEdge(
  session: ImageCropSession,
  newHeight: number
): NormalizedCrop {
  const maxHeight = 1 - session.originCrop.y;
  let nextHeight = newHeight / (session.scaleY * session.naturalHeight);
  nextHeight = Math.max(0.001, Math.min(maxHeight, nextHeight));

  return clampNormalizedCrop({
    height: nextHeight,
    width: session.originCrop.width,
    x: session.originCrop.x,
    y: session.originCrop.y,
  });
}

function cropFromTopEdge(
  session: ImageCropSession,
  newHeight: number
): NormalizedCrop {
  const cropBottom = session.originCrop.y + session.originCrop.height;
  let nextHeight = newHeight / (session.scaleY * session.naturalHeight);
  let nextY = cropBottom - nextHeight;

  if (nextY < 0) {
    nextY = 0;
    nextHeight = cropBottom;
  }

  return clampNormalizedCrop({
    height: nextHeight,
    width: session.originCrop.width,
    x: session.originCrop.x,
    y: nextY,
  });
}

export function computeEdgeCropBox(
  session: ImageCropSession,
  newWidth: number,
  newHeight: number
): { box: CanvasTransformBox; crop: NormalizedCrop } {
  let crop = session.originCrop;

  switch (session.anchor) {
    case 'middle-right': {
      crop = cropFromRightEdge(session, newWidth);
      break;
    }
    case 'middle-left': {
      crop = cropFromLeftEdge(session, newWidth);
      break;
    }
    case 'bottom-center': {
      crop = cropFromBottomEdge(session, newHeight);
      break;
    }
    case 'top-center': {
      crop = cropFromTopEdge(session, newHeight);
      break;
    }
    default: {
      break;
    }
  }

  const width = crop.width * session.naturalWidth * session.scaleX;
  const height = crop.height * session.naturalHeight * session.scaleY;

  let x = session.originBox.x;
  let y = session.originBox.y;

  if (session.anchor === 'middle-left') {
    x = session.originBox.x + session.originBox.width - width;
  } else if (session.anchor === 'top-center') {
    y = session.originBox.y + session.originBox.height - height;
  }

  return {
    box: {
      height,
      rotation: session.originBox.rotation,
      width,
      x,
      y,
    },
    crop,
  };
}

export function computeEdgeCropFromPointer(
  session: ImageCropSession,
  pointerParent: { x: number; y: number }
): { box: CanvasTransformBox; crop: NormalizedCrop } {
  const local = toLocalPoint(
    pointerParent,
    { x: session.originBox.x, y: session.originBox.y },
    session.originTransform.rotation
  );

  let width = session.originBox.width;
  let height = session.originBox.height;

  switch (session.anchor) {
    case 'middle-right': {
      width = Math.max(MIN_LAYER_SIZE, local.x);
      break;
    }
    case 'middle-left': {
      width = Math.max(MIN_LAYER_SIZE, session.originBox.width - local.x);
      break;
    }
    case 'bottom-center': {
      height = Math.max(MIN_LAYER_SIZE, local.y);
      break;
    }
    case 'top-center': {
      height = Math.max(MIN_LAYER_SIZE, session.originBox.height - local.y);
      break;
    }
    default: {
      break;
    }
  }

  return computeEdgeCropBox(session, width, height);
}

export function constrainImageEdgeCropBox(
  session: ImageCropSession,
  pointerParent: { x: number; y: number } | null,
  fallbackWidth: number,
  fallbackHeight: number
): { box: CanvasTransformBox; crop: NormalizedCrop } {
  if (pointerParent) {
    return computeEdgeCropFromPointer(session, pointerParent);
  }
  return computeEdgeCropBox(session, fallbackWidth, fallbackHeight);
}

export function cropToTransform(
  session: ImageCropSession,
  crop: NormalizedCrop,
  box: CanvasTransformBox
): Transform {
  return {
    height: crop.height * session.naturalHeight * session.scaleY,
    opacity: session.originTransform.opacity,
    rotation: box.rotation,
    width: crop.width * session.naturalWidth * session.scaleX,
    x: box.x,
    y: box.y,
  };
}

export function isFullCrop(crop: NormalizedCrop): boolean {
  return crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1;
}
