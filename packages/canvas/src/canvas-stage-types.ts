import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import type {
  CanvasLayerInteractionRegistration,
  CanvasLayerRendererRegistration,
} from './registry/canvas-registry-types';
import type { CanvasOverlayPrimitive } from './stage/canvas-overlay-primitives';
import type {
  CanvasRect,
  CanvasStageInteractionService,
} from './stage/canvas-stage-interaction';
import type { ViewportController } from './viewport';

export interface SelectionBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface DragSession {
  layerId: string;
  starts: Map<string, { x: number; y: number }>;
}

export interface CanvasSelectLayerOptions {
  additive?: boolean;
}

export interface CanvasStageLayer {
  layer: SceneLayer;
  view: LayerPreviewDescriptor;
}

export interface CanvasTransformChange {
  transform: SceneLayer['transform'];
  fontSize?: number;
}

export interface CanvasStageProps {
  containerWidth: number;
  containerHeight: number;
  artboardWidth: number;
  artboardHeight: number;
  layers: CanvasStageLayer[];
  selectedLayerIds: string[];
  editingLayerId?: string | null;
  pageMarginBounds?: CanvasRect | null;
  showMargins?: boolean;
  onSelectLayer: (layerId: string, options?: CanvasSelectLayerOptions) => void;
  onLayerDoubleClick?: (layerId: string) => void;
  onTransformChange?: (layerId: string, change: CanvasTransformChange) => void;
  onViewportChange?: (zoom: number) => void;
  viewportController?: ViewportController;
  canvasLayerRenderers?: CanvasLayerRendererRegistration[];
  canvasLayerInteractions?: CanvasLayerInteractionRegistration[];
  stageInteraction?: CanvasStageInteractionService | null;
  fontLoadRevision?: number;
}

export const EMPTY_CANVAS_LAYER_RENDERERS: CanvasLayerRendererRegistration[] =
  [];
export const EMPTY_CANVAS_LAYER_INTERACTIONS: CanvasLayerInteractionRegistration[] =
  [];
export const EMPTY_OVERLAY_PRIMITIVES: CanvasOverlayPrimitive[] = [];
