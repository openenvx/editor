import type { Layer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';

export interface CanvasLayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
  children?: CanvasLayerSurfaceItem[];
}
