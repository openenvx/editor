import type { Transform } from '@openenvx/schema';

import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';

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

export interface CanvasTransformModifiers {
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export interface CanvasInteractionLayoutContext {
  layerId: string;
  node: unknown;
  transform: Transform;
  view: unknown;
  zoom?: number;
}

export type CanvasHandleLayoutContext = CanvasInteractionLayoutContext & {
  zoom: number;
};

export interface CanvasTransformContext extends CanvasInteractionLayoutContext {
  transformer: unknown;
  anchor: string | null;
  modifiers?: CanvasTransformModifiers;
  setLiveTransform?: (transform: Transform | null) => void;
}

export interface HandleDescriptor {
  anchor: string;
  height: number;
  rotation: number;
  shape?: 'circle' | 'rect';
  width: number;
  x: number;
  y: number;
}

export interface CanvasHandleDragContext extends CanvasHandleLayoutContext {
  anchor: string;
  setLiveTransform?: (transform: Transform | null) => void;
  setOverlays?: (overlays: CanvasOverlayPrimitive[]) => void;
}

export interface CanvasTransformResult {
  transform: Transform;
  fontSize?: number;
  dataPatch?: Record<string, unknown>;
}

export interface CanvasLayerActivateContext {
  layerId: string;
  node: unknown;
  transform: Transform;
  view: unknown;
}

export interface CanvasLayerInteractionRegistration {
  kind: string;
  usesEditOverlay?: boolean;
  opensEditorOnReselect?: (view: unknown) => boolean;
  enabledAnchors?: () => readonly string[] | null;
  providesHandles?: (view: unknown) => boolean;
  layoutHandles?: (ctx: CanvasHandleLayoutContext) => HandleDescriptor[];
  onTransformStart?: (ctx: CanvasTransformContext) => void;
  onTransform?: (ctx: CanvasTransformContext) => void;
  onTransformEnd?: (
    ctx: CanvasTransformContext
  ) => CanvasTransformResult | void;
  boundBoxFunc?: (
    ctx: CanvasTransformContext,
    oldBox: CanvasTransformBox,
    newBox: CanvasTransformBox,
    pointerParentLocal?: { x: number; y: number } | null
  ) => CanvasTransformBox;
  onHandleDragStart?: (ctx: CanvasHandleDragContext) => void;
  onHandleDragMove?: (
    ctx: CanvasHandleDragContext,
    pointerParentLocal: { x: number; y: number }
  ) => void;
  onHandleDragEnd?: (
    ctx: CanvasHandleDragContext
  ) => CanvasTransformResult | void;
  hideContentDuringTransform?: (layerId: string) => boolean;
  hideContentDuringEdit?: (
    editingLayerId: string | null,
    layerId: string
  ) => boolean;
  onLayerActivate?: (ctx: CanvasLayerActivateContext) => void;
  onLayerDeactivate?: (layerId: string) => void;
  /** Fired on canvas pointer click (before/with selection). */
  onClick?: (layerId: string) => void;
  onDoubleClick?: (layerId: string) => void;
}
