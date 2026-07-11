import type {
  CanvasDragAdjustInput,
  CanvasOverlayBuildContext,
  CanvasOverlayPrimitive,
  CanvasResizeAdjustInput,
  CanvasStageInteractionService,
} from '@openenvx/canvas';

import { computeDragSnap } from '../snap/smart-guides/drag-snap';
import { computeResizeSnap } from '../snap/smart-guides/resize-snap';
import {
  computeSnapThreshold,
  snapBoundsFromTransform,
  toSnapBounds,
} from '../snap/smart-guides/snap-bounds';
import type { SnapBounds } from '../snap/smart-guides/types';
import { guidesToOverlayPrimitives } from './guides-to-overlay-primitives';

function boundsToSnapBounds(
  bounds: CanvasDragAdjustInput['moving']['bounds']
): SnapBounds {
  return toSnapBounds(bounds.x, bounds.y, bounds.width, bounds.height);
}

function marginInsetToSnapBounds(
  marginInset: CanvasDragAdjustInput['marginInset']
): SnapBounds | null {
  if (!marginInset) {
    return null;
  }
  return toSnapBounds(
    marginInset.x,
    marginInset.y,
    marginInset.width,
    marginInset.height
  );
}

export class SmartGuidesStageInteraction implements CanvasStageInteractionService {
  adjustDrag(input: CanvasDragAdjustInput) {
    const result = computeDragSnap({
      artboard: input.artboard,
      marginBounds: marginInsetToSnapBounds(input.marginInset),
      moving: {
        bounds: boundsToSnapBounds(input.moving.bounds),
        layerType: input.moving.layerType,
      },
      others: input.others.map((entry) => ({
        bounds: snapBoundsFromTransform(entry.transform),
        layerType: entry.layerType,
      })),
      threshold: computeSnapThreshold(input.zoom),
    });
    return {
      overlays: guidesToOverlayPrimitives(result.guides, result.spacing),
      x: result.x,
      y: result.y,
    };
  }

  adjustResize(input: CanvasResizeAdjustInput) {
    const result = computeResizeSnap({
      anchor: input.anchor,
      artboard: input.artboard,
      box: input.box,
      marginBounds: marginInsetToSnapBounds(input.marginInset),
      others: input.others.map((entry) =>
        snapBoundsFromTransform(entry.transform)
      ),
      threshold: computeSnapThreshold(input.zoom),
    });
    return {
      box: result.box,
      overlays: guidesToOverlayPrimitives(result.guides, result.spacing),
    };
  }

  buildOverlays(_ctx: CanvasOverlayBuildContext): CanvasOverlayPrimitive[] {
    return [];
  }
}
