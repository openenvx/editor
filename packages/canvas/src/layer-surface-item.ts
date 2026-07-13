import type { Layer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

export interface CanvasLayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
  children?: CanvasLayerSurfaceItem[];
}
