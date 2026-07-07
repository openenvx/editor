import type { Transform } from '@openenvx/schema';

export interface CanvasLayerRendererRegistration {
  kind: string;
  Component: unknown;
}

export interface LayerPreviewRendererRegistration {
  kind: string;
  Component: unknown;
}

export interface CanvasTransformBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface CanvasTransformContext {
  layerId: string;
  view: unknown;
  node: unknown;
  transformer: unknown;
  transform: Transform;
  anchor: string | null;
}

export interface CanvasTransformResult {
  transform: Transform;
  fontSize?: number;
}

export interface CanvasLayerInteractionRegistration {
  kind: string;
  usesEditOverlay?: boolean;
  enabledAnchors?: () => readonly string[] | null;
  onTransformStart?: (ctx: CanvasTransformContext) => void;
  onTransform?: (ctx: CanvasTransformContext) => void;
  onTransformEnd?: (
    ctx: CanvasTransformContext
  ) => CanvasTransformResult | void;
  boundBoxFunc?: (
    ctx: CanvasTransformContext,
    oldBox: CanvasTransformBox,
    newBox: CanvasTransformBox
  ) => CanvasTransformBox;
  hideContentDuringTransform?: (layerId: string) => boolean;
  hideContentDuringEdit?: (
    editingLayerId: string | null,
    layerId: string
  ) => boolean;
  onDoubleClick?: (layerId: string) => void;
}
