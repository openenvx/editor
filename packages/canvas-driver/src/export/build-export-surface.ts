import { getLayerChildrenForScene } from '@openenvx/studio/core';
import type {
  Document,
  DocumentNode,
  LayerRegistry,
} from '@openenvx/studio/core';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';
import { nodeProps } from '@openenvx/studio/schema';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';

function buildSurfaceItem(
  layer: DocumentNode,
  scene: Document,
  registry: LayerRegistry
): CanvasLayerSurfaceItem {
  const def = registry.get(layer.type);
  const previewCtx = {
    isSelected: false,
    layerId: layer.id,
    model: def ? def.getModel(layer) : nodeProps(layer),
    registry,
  };
  const view = (
    def
      ? def.renderPreview(previewCtx)
      : { kind: 'placeholder', text: `Unknown: ${layer.type}` }
  ) as LayerPreviewDescriptor;
  const childLayers = getLayerChildrenForScene(layer, scene);
  const children =
    childLayers.length > 0
      ? childLayers.map((child) => buildSurfaceItem(child, scene, registry))
      : undefined;
  return { children, layer, view };
}

export function buildExportSurface(
  scene: Document,
  pageId: string,
  registry: LayerRegistry
): CanvasLayerSurfaceItem[] {
  const page = scene.artboards.find((entry) => entry.id === pageId);
  if (!page) {
    throw new Error(`Artboard "${pageId}" not found`);
  }
  return page.nodes.map((layer) => buildSurfaceItem(layer, scene, registry));
}
