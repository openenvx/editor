import { MIN_LAYER_SIZE } from '@openenvx/core';

import { constrainTransformerBox } from './geometry';
import type { TransformerBox } from './geometry';

export const IMAGE_CORNER_ANCHORS = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;

export const IMAGE_EDGE_ANCHORS = [
  'middle-left',
  'middle-right',
  'top-center',
  'bottom-center',
] as const;

export type ImageCornerAnchor = (typeof IMAGE_CORNER_ANCHORS)[number];
export type ImageEdgeAnchor = (typeof IMAGE_EDGE_ANCHORS)[number];

export function isImageCornerAnchor(
  anchor: string
): anchor is ImageCornerAnchor {
  return (IMAGE_CORNER_ANCHORS as readonly string[]).includes(anchor);
}

export function isImageEdgeAnchor(anchor: string): anchor is ImageEdgeAnchor {
  return (IMAGE_EDGE_ANCHORS as readonly string[]).includes(anchor);
}

function repositionCornerBox(
  anchor: ImageCornerAnchor,
  oldBox: TransformerBox,
  width: number,
  height: number
): Pick<TransformerBox, 'height' | 'width' | 'x' | 'y'> {
  switch (anchor) {
    case 'top-left': {
      return {
        height,
        width,
        x: oldBox.x + oldBox.width - width,
        y: oldBox.y + oldBox.height - height,
      };
    }
    case 'top-right': {
      return {
        height,
        width,
        x: oldBox.x,
        y: oldBox.y + oldBox.height - height,
      };
    }
    case 'bottom-left': {
      return {
        height,
        width,
        x: oldBox.x + oldBox.width - width,
        y: oldBox.y,
      };
    }
    case 'bottom-right': {
      return {
        height,
        width,
        x: oldBox.x,
        y: oldBox.y,
      };
    }
    default: {
      return { height, width, x: oldBox.x, y: oldBox.y };
    }
  }
}

export function boundImageCornerBox(
  origin: TransformerBox,
  anchor: string,
  oldBox: TransformerBox,
  newBox: TransformerBox,
  freeStretch: boolean
): TransformerBox {
  if (!isImageCornerAnchor(anchor) || freeStretch) {
    return constrainTransformerBox(oldBox, newBox);
  }

  if (origin.width < MIN_LAYER_SIZE || origin.height < MIN_LAYER_SIZE) {
    return constrainTransformerBox(oldBox, newBox);
  }

  const aspect = origin.width / origin.height;
  const widthChange = Math.abs(newBox.width - oldBox.width);
  const heightChange = Math.abs(newBox.height - oldBox.height);

  let width = Math.max(MIN_LAYER_SIZE, newBox.width);
  let height = Math.max(MIN_LAYER_SIZE, newBox.height);

  if (widthChange >= heightChange) {
    height = width / aspect;
  } else {
    width = height * aspect;
  }

  if (width < MIN_LAYER_SIZE || height < MIN_LAYER_SIZE) {
    return constrainTransformerBox(oldBox, newBox);
  }

  const positioned = repositionCornerBox(anchor, oldBox, width, height);

  return constrainTransformerBox(oldBox, {
    ...newBox,
    ...positioned,
    rotation: newBox.rotation,
  });
}
