import type { CanvasLayerInteractionContribution } from '../contributions/canvas-layer-interaction-contribution';
import type { CanvasLayerRendererContribution } from '../contributions/canvas-layer-renderer-contribution';
import type { LayerPreviewRendererContribution } from '../contributions/layer-preview-renderer-contribution';
import {
  KindRegistry,
  type KindRegistryRegisterOptions,
} from './create-kind-registry';

export type CanvasRegistryRegisterOptions = KindRegistryRegisterOptions;

export class CanvasRegistries {
  readonly canvasLayerRenderers =
    new KindRegistry<CanvasLayerRendererContribution>('Canvas layer renderer');
  readonly layerPreviewRenderers =
    new KindRegistry<LayerPreviewRendererContribution>(
      'Layer preview renderer'
    );
  readonly canvasLayerInteractions =
    new KindRegistry<CanvasLayerInteractionContribution>(
      'Canvas layer interaction'
    );
}
