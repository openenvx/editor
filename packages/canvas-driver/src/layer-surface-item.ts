import type { DocumentNode } from '@openenvx/editor';
import type { LayerPreviewDescriptor } from '@openenvx/editor/preview';

export interface CanvasLayerSurfaceItem {
  layer: DocumentNode;
  view: LayerPreviewDescriptor;
  children?: CanvasLayerSurfaceItem[];
}
