import type { LayerRegistry } from '@openenvx/studio/core';
import { nodeTransform } from '@openenvx/studio/schema';
import type { Document } from '@openenvx/studio/schema';
import Konva from 'konva';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { createCanvasLayerRegistry } from '../layers/create-canvas-layer-registry';
import { buildExportSurface } from './build-export-surface';
import {
  drawPreviewToKonva,
  shouldSkipLayerContent,
  type ExportImageLoader,
} from './draw-preview-to-konva';

export interface RenderExportStageOptions {
  scene: Document;
  pageId: string;
  widthPx: number;
  heightPx: number;
  background: string;
  imageLoader: ExportImageLoader;
  registry?: LayerRegistry;
}

async function appendSurfaceItem(
  parent: Konva.Group | Konva.Layer,
  item: CanvasLayerSurfaceItem,
  imageLoader: ExportImageLoader
): Promise<void> {
  if (item.layer.visible === false) {
    return;
  }
  const transform = nodeTransform(item.layer);
  const group = new Konva.Group({
    height: transform.height,
    listening: false,
    opacity: transform.opacity ?? 1,
    rotation: transform.rotation ?? 0,
    width: transform.width,
    x: transform.x,
    y: transform.y,
  });
  if (!shouldSkipLayerContent(item.layer.type)) {
    await drawPreviewToKonva(group, item.view, transform, imageLoader);
  }
  if (item.children?.length) {
    for (const child of item.children) {
      await appendSurfaceItem(group, child, imageLoader);
    }
  }
  parent.add(group);
}

export async function renderExportStage(
  options: RenderExportStageOptions
): Promise<Konva.Stage> {
  const registry = options.registry ?? createCanvasLayerRegistry();
  const surface = buildExportSurface(options.scene, options.pageId, registry);
  const container =
    typeof document !== 'undefined' ? document.createElement('div') : undefined;
  const stage = new Konva.Stage({
    container,
    height: options.heightPx,
    listening: false,
    width: options.widthPx,
  });
  const layer = new Konva.Layer({ listening: false });
  layer.add(
    new Konva.Rect({
      fill: options.background,
      height: options.heightPx,
      listening: false,
      width: options.widthPx,
      x: 0,
      y: 0,
    })
  );
  for (const item of surface) {
    await appendSurfaceItem(layer, item, options.imageLoader);
  }
  stage.add(layer);
  layer.batchDraw();
  return stage;
}
