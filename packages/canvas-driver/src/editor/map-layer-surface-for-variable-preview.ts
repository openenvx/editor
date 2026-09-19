import { findLayerById } from '@openenvx/studio/core';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';
import type { Scene } from '@openenvx/studio/schema';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { prepareCanvasSceneForRender } from '../prepare-canvas-scene-for-render';

function mapViewForVariablePreview(
  view: LayerPreviewDescriptor,
  previewHtml: string | undefined
): LayerPreviewDescriptor {
  if (view.kind !== 'richText' || previewHtml === undefined) {
    return view;
  }
  return { ...view, html: previewHtml };
}

function mapLayerSurfaceItemForVariablePreview(
  item: CanvasLayerSurfaceItem,
  fittedScene: Scene
): CanvasLayerSurfaceItem {
  const fittedLayer = findLayerById(fittedScene, item.layer.id);
  const previewHtml =
    fittedLayer &&
    typeof fittedLayer.data === 'object' &&
    fittedLayer.data !== null
      ? (fittedLayer.data as { html?: string }).html
      : undefined;

  const children = item.children?.map((child) =>
    mapLayerSurfaceItemForVariablePreview(child, fittedScene)
  );

  const layer =
    fittedLayer && fittedLayer.transform
      ? {
          ...item.layer,
          data: fittedLayer.data,
          transform: fittedLayer.transform,
        }
      : item.layer;

  return {
    ...item,
    layer,
    view: mapViewForVariablePreview(item.view, previewHtml),
    ...(children ? { children } : {}),
  };
}

/** Konva preview with catalog `sample` values; stored scene keeps `{{{key}}}` tokens. */
export function mapLayerSurfaceForVariablePreview(
  layerSurface: CanvasLayerSurfaceItem[],
  scene: Scene
): CanvasLayerSurfaceItem[] {
  const fittedScene = prepareCanvasSceneForRender(scene, { mode: 'preview' });
  return layerSurface.map((item) =>
    mapLayerSurfaceItemForVariablePreview(item, fittedScene)
  );
}
