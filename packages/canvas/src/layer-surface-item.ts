import type { Layer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/core/preview';

export interface CanvasLayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
  children?: CanvasLayerSurfaceItem[];
}
