import type {
  CanvasLayerInteractionRegistration,
  CanvasLayerRendererRegistration,
  LayerPreviewRendererRegistration,
} from './canvas-registry-types';

export interface CanvasRegistriesSnapshot {
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  layerPreviewRenderers: LayerPreviewRendererRegistration[];
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
}

export interface CanvasRegistriesReader {
  getSnapshot(): CanvasRegistriesSnapshot;
}
