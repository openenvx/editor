import {
  applyGridSnapToDragPosition,
  applyGridSnapToResizeBox,
} from '../snap/grid-snap';
import { computeDragSnap } from '../snap/smart-guides/drag-snap';
import { computeResizeSnap } from '../snap/smart-guides/resize-snap';
import {
  computeSnapThreshold,
  snapBoundsFromTransform,
  toSnapBounds,
} from '../snap/smart-guides/snap-bounds';
import type { SnapBounds } from '../snap/smart-guides/types';
import type { CanvasOverlayPrimitive } from './canvas-overlay-primitives';
import type {
  CanvasDragAdjustInput,
  CanvasOverlayBuildContext,
  CanvasResizeAdjustInput,
  CanvasStageInteractionService,
} from './canvas-stage-interaction';
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
      userGuides: input.userGuides,
    });

    let { x, y } = result;
    if (input.grid?.enabled) {
      const gridSnapped = applyGridSnapToDragPosition({
        originalX: input.moving.bounds.x,
        originalY: input.moving.bounds.y,
        size: input.grid.size,
        snappedX: x,
        snappedY: y,
      });
      x = gridSnapped.x;
      y = gridSnapped.y;
    }

    return {
      overlays: guidesToOverlayPrimitives(result.guides, result.spacing),
      x,
      y,
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
      userGuides: input.userGuides,
    });

    let { box } = result;
    if (input.grid?.enabled) {
      box = applyGridSnapToResizeBox({
        anchor: input.anchor,
        original: input.box,
        size: input.grid.size,
        snapped: box,
      });
    }

    return {
      box,
      overlays: guidesToOverlayPrimitives(result.guides, result.spacing),
    };
  }

  buildOverlays(_ctx: CanvasOverlayBuildContext): CanvasOverlayPrimitive[] {
    return [];
  }
}
