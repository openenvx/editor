import type { Layer } from '@openenvx/studio/core';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';

export interface CanvasLayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
  children?: CanvasLayerSurfaceItem[];
}
