import type { Layer } from '@openenvx/studio';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';

export interface CanvasLayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
  children?: CanvasLayerSurfaceItem[];
}
