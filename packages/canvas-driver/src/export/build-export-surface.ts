import { getLayerChildrenForScene } from '@openenvx/studio/core';
import type { Layer, LayerRegistry, Scene } from '@openenvx/studio/core';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';

function buildSurfaceItem(
  layer: Layer,
  scene: Scene,
  registry: LayerRegistry
): CanvasLayerSurfaceItem {
  const def = registry.get(layer.type);
  const previewCtx = {
    isSelected: false,
    layerId: layer.id,
    model: def ? def.getModel(layer) : layer.data,
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
  scene: Scene,
  pageId: string,
  registry: LayerRegistry
): CanvasLayerSurfaceItem[] {
  const page = scene.pages.find((entry) => entry.id === pageId);
  if (!page) {
    throw new Error(`Page "${pageId}" not found`);
  }
  return page.layers.map((layer) => buildSurfaceItem(layer, scene, registry));
}
