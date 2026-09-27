import { findNodeById } from '@openenvx/studio';
import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';
import { encodeQrToSvg } from '@openenvx/studio/preview';
import type { CanvasQrProps, Document } from '@openenvx/studio/schema';
import {
  applyNodeTransform,
  nodeProps,
  nodeTransform,
} from '@openenvx/studio/schema';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { prepareCanvasSceneForRender } from '../prepare-canvas-scene-for-render';

function mapViewForVariablePreview(
  view: LayerPreviewDescriptor,
  previewHtml: string | undefined,
  qrProps: CanvasQrProps | undefined
): LayerPreviewDescriptor {
  if (view.kind === 'richText' && previewHtml !== undefined) {
    return { ...view, html: previewHtml };
  }
  if (
    view.kind === 'svg' &&
    qrProps !== undefined &&
    typeof qrProps.url === 'string'
  ) {
    const svg = encodeQrToSvg(qrProps.url, {
      background: qrProps.background,
      errorCorrection: qrProps.errorCorrection,
      foreground: qrProps.foreground,
      margin: qrProps.margin,
    });
    return { ...view, svg };
  }
  return view;
}

function mapLayerSurfaceItemForVariablePreview(
  item: CanvasLayerSurfaceItem,
  fittedScene: Document
): CanvasLayerSurfaceItem {
  const fittedLayer = findNodeById(fittedScene, item.layer.id);
  const props = fittedLayer ? nodeProps(fittedLayer) : {};
  const previewHtml = typeof props.html === 'string' ? props.html : undefined;
  const qrProps =
    fittedLayer?.type === 'canvas.qr' && typeof props.url === 'string'
      ? (props as unknown as CanvasQrProps)
      : undefined;

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
    view: mapViewForVariablePreview(item.view, previewHtml, qrProps),
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
