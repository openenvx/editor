import { CanvasLayerInteractionContribution } from '../contributions/canvas-layer-interaction-contribution';
import {
  boundImageCornerBox,
  IMAGE_CORNER_ANCHORS,
  isImageCornerAnchor,
} from '../image-resize';
import type {
  CanvasTransformBox,
  CanvasTransformContext,
} from '../registry/canvas-registry-types';

export class ImageCanvasInteraction extends CanvasLayerInteractionContribution {
  readonly kind = 'image';

  enabledAnchors() {
    return IMAGE_CORNER_ANCHORS;
  }

  boundBoxFunc(
    ctx: CanvasTransformContext,
    oldBox: CanvasTransformBox,
    newBox: CanvasTransformBox
  ): CanvasTransformBox {
    const anchor = ctx.anchor ?? '';
    if (!isImageCornerAnchor(anchor)) {
      return newBox;
    }

    const origin = {
      height: ctx.transform.height,
      rotation: ctx.transform.rotation,
      width: ctx.transform.width,
      x: ctx.transform.x,
      y: ctx.transform.y,
    };

    return boundImageCornerBox(
      origin,
      anchor,
      oldBox,
      newBox,
      ctx.modifiers?.shift ?? false
    );
  }
}
