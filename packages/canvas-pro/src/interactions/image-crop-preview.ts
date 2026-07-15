import type { ImageEdgeAnchor } from '@openenvx/canvas';
import Konva from 'konva';

import type { ImageCropSession } from './image-crop-utils';

const PREVIEW_GROUP_NAME = 'image-crop-preview';
const DIM_OPACITY = 0.4;
const MASK_FILL = 'rgba(80,80,80,0.6)';

export function clearImageCropPreview(node: Konva.Group): void {
  const existing = node.findOne(`.${PREVIEW_GROUP_NAME}`);
  existing?.destroy();
  node.getLayer()?.batchDraw();
}

function greyMaskForAnchor(
  anchor: ImageEdgeAnchor,
  frameWidth: number,
  frameHeight: number,
  fullLocal: { height: number; width: number; x: number; y: number }
): Konva.Rect | null {
  const fullRight = fullLocal.x + fullLocal.width;
  const fullBottom = fullLocal.y + fullLocal.height;

  switch (anchor) {
    case 'middle-right': {
      if (frameWidth >= fullRight - fullLocal.x) {
        return null;
      }
      return new Konva.Rect({
        fill: MASK_FILL,
        height: frameHeight,
        listening: false,
        width: fullRight - frameWidth,
        x: frameWidth,
        y: 0,
      });
    }
    case 'middle-left': {
      if (fullLocal.x >= 0) {
        return null;
      }
      return new Konva.Rect({
        fill: MASK_FILL,
        height: frameHeight,
        listening: false,
        width: -fullLocal.x,
        x: fullLocal.x,
        y: 0,
      });
    }
    case 'bottom-center': {
      if (frameHeight >= fullBottom - fullLocal.y) {
        return null;
      }
      return new Konva.Rect({
        fill: MASK_FILL,
        height: fullBottom - frameHeight,
        listening: false,
        width: frameWidth,
        x: 0,
        y: frameHeight,
      });
    }
    case 'top-center': {
      if (fullLocal.y >= 0) {
        return null;
      }
      return new Konva.Rect({
        fill: MASK_FILL,
        height: -fullLocal.y,
        listening: false,
        width: frameWidth,
        x: 0,
        y: fullLocal.y,
      });
    }
    default: {
      return null;
    }
  }
}

export function renderImageCropPreview(input: {
  frameBox: { height: number; width: number; x: number; y: number };
  groupNode: Konva.Group;
  image: HTMLImageElement;
  session: ImageCropSession;
}): void {
  clearImageCropPreview(input.groupNode);

  const fullLocal = {
    height: input.session.fullImageLayout.height,
    width: input.session.fullImageLayout.width,
    x: input.session.fullImageLayout.x - input.frameBox.x,
    y: input.session.fullImageLayout.y - input.frameBox.y,
  };

  const previewGroup = new Konva.Group({ name: PREVIEW_GROUP_NAME });

  const dimmed = new Konva.Image({
    height: fullLocal.height,
    image: input.image,
    listening: false,
    opacity: DIM_OPACITY,
    width: fullLocal.width,
    x: fullLocal.x,
    y: fullLocal.y,
  });

  const brightGroup = new Konva.Group({
    clip: {
      height: input.frameBox.height,
      width: input.frameBox.width,
      x: 0,
      y: 0,
    },
  });
  brightGroup.add(
    new Konva.Image({
      height: fullLocal.height,
      image: input.image,
      listening: false,
      width: fullLocal.width,
      x: fullLocal.x,
      y: fullLocal.y,
    })
  );

  const greyMask = greyMaskForAnchor(
    input.session.anchor,
    input.frameBox.width,
    input.frameBox.height,
    fullLocal
  );

  previewGroup.add(dimmed, brightGroup);
  if (greyMask) {
    previewGroup.add(greyMask);
  }

  input.groupNode.add(previewGroup);
  previewGroup.moveToTop();
  input.groupNode.getLayer()?.batchDraw();
}

export function loadPreviewImage(
  src: string
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const element = new window.Image();
    element.crossOrigin = 'anonymous';
    element.src = src;
    element.onload = () => resolve(element);
    element.onerror = () => resolve(null);
  });
}
