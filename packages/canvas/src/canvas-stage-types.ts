import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import type {
  GuideLine,
  SnapBounds,
  SpacingGuide,
} from './interactions/smart-guides';
import type {
  CanvasLayerInteractionRegistration,
  CanvasLayerRendererRegistration,
} from './registry/canvas-registry-types';
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

export interface SmartGuideState {
  guides: GuideLine[];
  spacing: SpacingGuide[];
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
  pageMarginBounds?: SnapBounds | null;
  showMargins?: boolean;
  onSelectLayer: (layerId: string, options?: CanvasSelectLayerOptions) => void;
  onLayerDoubleClick?: (layerId: string) => void;
  onTransformChange?: (layerId: string, change: CanvasTransformChange) => void;
  onViewportChange?: (zoom: number) => void;
  viewportController?: ViewportController;
  canvasLayerRenderers?: CanvasLayerRendererRegistration[];
  canvasLayerInteractions?: CanvasLayerInteractionRegistration[];
  fontLoadRevision?: number;
}

export const EMPTY_CANVAS_LAYER_RENDERERS: CanvasLayerRendererRegistration[] =
  [];
export const EMPTY_CANVAS_LAYER_INTERACTIONS: CanvasLayerInteractionRegistration[] =
  [];
export const EMPTY_SMART_GUIDES: SmartGuideState = { guides: [], spacing: [] };
