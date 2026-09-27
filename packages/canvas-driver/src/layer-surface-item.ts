import type { DocumentNode } from '@openenvx/studio';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';

export interface CanvasLayerSurfaceItem {
  layer: DocumentNode;
  view: LayerPreviewDescriptor;
  children?: CanvasLayerSurfaceItem[];
}
