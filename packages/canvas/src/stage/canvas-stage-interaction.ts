import type { Transform } from '@openenvx/schema';

import type { CanvasOverlayPrimitive } from './canvas-overlay-primitives';

export interface CanvasRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface CanvasLayerTransformRef {
  layerType: string;
  transform: Transform;
}

export interface CanvasGridSnapConfig {
  enabled: boolean;
  size: number;
}

export interface CanvasUserGuidesSnapConfig {
  xs: number[];
  ys: number[];
}

export interface CanvasDragAdjustInput {
  artboard: { height: number; width: number };
  grid: CanvasGridSnapConfig | null;
  marginInset: CanvasRect | null;
  moving: { bounds: CanvasRect; layerType: string };
  others: CanvasLayerTransformRef[];
  userGuides?: CanvasUserGuidesSnapConfig | null;
  zoom: number;
}

export interface CanvasDragAdjustResult {
  overlays: readonly CanvasOverlayPrimitive[];
  x: number;
  y: number;
}

export interface CanvasResizeAdjustInput {
  anchor: string;
  artboard: { height: number; width: number };
  box: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  };
  grid: CanvasGridSnapConfig | null;
  marginInset: CanvasRect | null;
  others: CanvasLayerTransformRef[];
  userGuides?: CanvasUserGuidesSnapConfig | null;
  zoom: number;
}

export interface CanvasResizeAdjustResult {
  box: CanvasResizeAdjustInput['box'];
  overlays: readonly CanvasOverlayPrimitive[];
}

export interface CanvasOverlayBuildContext {
  artboard: { height: number; width: number };
  zoom: number;
}

export interface CanvasStageInteractionService {
  adjustDrag?(input: CanvasDragAdjustInput): CanvasDragAdjustResult | undefined;

  adjustResize?(
    input: CanvasResizeAdjustInput
  ): CanvasResizeAdjustResult | undefined;

  buildOverlays?(
    ctx: CanvasOverlayBuildContext
  ): readonly CanvasOverlayPrimitive[] | undefined;
}

export function unionCanvasRects(rects: CanvasRect[]): CanvasRect {
  if (rects.length === 0) {
    return { height: 0, width: 0, x: 0, y: 0 };
  }
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  };
}
