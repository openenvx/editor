import { findNodeById } from '@openenvx/studio/core';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';
import type { Document } from '@openenvx/studio/schema';
import {
  applyNodeTransform,
  nodeProps,
  nodeTransform,
} from '@openenvx/studio/schema';

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
  fittedScene: Document
): CanvasLayerSurfaceItem {
  const fittedLayer = findNodeById(fittedScene, item.layer.id);
  const props = fittedLayer ? nodeProps(fittedLayer) : {};
  const previewHtml = typeof props.html === 'string' ? props.html : undefined;

  const children = item.children?.map((child) =>
    mapLayerSurfaceItemForVariablePreview(child, fittedScene)
  );

  const layer =
    fittedLayer && fittedLayer.frame
      ? applyNodeTransform(
          { ...item.layer, props: fittedLayer.props },
          nodeTransform(fittedLayer)
        )
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
  scene: Document
): CanvasLayerSurfaceItem[] {
  const fittedScene = prepareCanvasSceneForRender(scene, { mode: 'preview' });
  return layerSurface.map((item) =>
    mapLayerSurfaceItemForVariablePreview(item, fittedScene)
  );
}
