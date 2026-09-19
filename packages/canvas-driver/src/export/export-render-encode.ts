import { computePageExportDimensions } from '@openenvx/studio/schema';
import type { Page, Scene } from '@openenvx/studio/schema';
import type Konva from 'konva';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { createCanvasLayerRegistry } from '../layers/create-canvas-layer-registry';
import { buildExportSurface } from './build-export-surface';
import type {
  CanvasExportOptions,
  CanvasExportResult,
} from './canvas-document-export-service';
import type { ExportImageLoader } from './draw-preview-to-konva';
import { encodeStageToBytes, mimeTypeForFormat } from './encode-stage-bytes';
import { renderExportStage } from './render-export-stage';
import { resolveCanvasExportScene } from './resolve-canvas-export-scene';
import {
  resolveExportRasterScale,
  resolveExportStageDimensions,
} from './resolve-export-raster-scale';
import {
  findExportPage,
  resolveExportBackground,
} from './resolve-export-request';
import { createTrackedExportImageLoader } from './track-export-image-loader';

export interface ExportRenderEncodeInput {
  scene: Scene;
  pageId: string;
  options: CanvasExportOptions;
  imageLoader: ExportImageLoader;
  ensureFonts: (surface: CanvasLayerSurfaceItem[]) => Promise<void>;
  strictAssets?: boolean;
}

function buildExportResult(
  page: Page,
  options: CanvasExportOptions,
  data: Uint8Array,
  mimeType: string,
  missingImageSrcs: string[]
): CanvasExportResult {
  const rasterScale = resolveExportRasterScale(page, options);
  const dimensions = computePageExportDimensions(page, {
    dpi: options.dpi,
    scale: rasterScale,
  });
  return {
    data,
    dimensions,
    fileName: options.fileName,
    mimeType,
    ...(missingImageSrcs.length > 0 ? { missingImageSrcs } : {}),
  };
}

function assertAssetsLoaded(
  missingImageSrcs: string[],
  strictAssets: boolean
): void {
  if (strictAssets && missingImageSrcs.length > 0) {
    throw new Error(
      `Export failed to load ${missingImageSrcs.length} image(s): ${missingImageSrcs.join(', ')}`
    );
  }
}

export async function exportRenderEncode(
  input: ExportRenderEncodeInput
): Promise<{ stage: Konva.Stage; result: CanvasExportResult }> {
  const scene = resolveCanvasExportScene(input.scene, input.options);
  const page = findExportPage(scene, input.pageId);
  const { widthPx, heightPx } = resolveExportStageDimensions(page);
  const registry = createCanvasLayerRegistry();
  const surface = buildExportSurface(scene, input.pageId, registry);
  await input.ensureFonts(surface);

  const missingImageSrcs: string[] = [];
  const stage = await renderExportStage({
    background: resolveExportBackground(page, input.options.background),
    heightPx,
    imageLoader: createTrackedExportImageLoader(
      input.imageLoader,
      missingImageSrcs
    ),
    pageId: input.pageId,
    registry,
    scene,
    widthPx,
  });
  assertAssetsLoaded(missingImageSrcs, input.strictAssets ?? false);

  const format = input.options.format;
  if (format !== 'png' && format !== 'jpg') {
    stage.destroy();
    throw new Error(`Unsupported raster export format: ${format}`);
  }

  const rasterScale = resolveExportRasterScale(page, input.options);
  const bytes = encodeStageToBytes(stage, format, {
    pixelRatio: rasterScale,
    quality: input.options.quality,
  });
  const result = buildExportResult(
    page,
    input.options,
    bytes,
    mimeTypeForFormat(format),
    missingImageSrcs
  );
  return { result, stage };
}
