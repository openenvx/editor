import { ImageCropInteraction } from '../interactions/image-crop-interaction';
import { ProImageCanvasRenderer } from '../renderers/pro-image-canvas-renderer';
import { CanvasLayerRendererContribution } from './canvas-layer-renderer-contribution';

class ProImageCanvasRendererContribution extends CanvasLayerRendererContribution {
  readonly kind = 'image';
  readonly Component = ProImageCanvasRenderer;
}

class ProImageInteractionContribution extends ImageCropInteraction {}

export const proImageCanvasContributions = [
  new ProImageCanvasRendererContribution(),
  new ProImageInteractionContribution(),
] as const;
