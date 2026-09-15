import type { Scene } from '@openenvx/core/schema';

import type {
  CanvasExportOptions,
  CanvasExportResult,
} from '../canvas-document-export-service';
import { mimeTypeForFormat } from '../encode-stage-bytes';
import { exportRenderEncode } from '../export-render-encode';
import { findExportPage } from '../resolve-export-request';
import { encodePngBytesToPdf } from './encode-pdf';
import { ensureNodeExportFonts } from './ensure-node-export-fonts';
import {
  ensureKonvaNodeBackend,
  loadNodeExportImage,
} from './setup-konva-node';

export async function exportCanvasDocument(
  scene: Scene,
  pageId: string,
  options: CanvasExportOptions
): Promise<CanvasExportResult> {
  ensureKonvaNodeBackend();
  const page = findExportPage(scene, pageId);

  if (options.format === 'pdf') {
    const { stage, result } = await exportRenderEncode({
      ensureFonts: ensureNodeExportFonts,
      imageLoader: loadNodeExportImage,
      options: { ...options, format: 'png' },
      pageId,
      scene,
      strictAssets: options.strictAssets ?? true,
    });
    stage.destroy();
    const pdfBytes = await encodePngBytesToPdf(result.data, page, {
      dpi: options.dpi,
    });
    return {
      ...result,
      data: pdfBytes,
      mimeType: mimeTypeForFormat('pdf'),
    };
  }

  if (options.format !== 'png' && options.format !== 'jpg') {
    throw new Error(`Unsupported export format: ${options.format}`);
  }

  const { stage, result } = await exportRenderEncode({
    ensureFonts: ensureNodeExportFonts,
    imageLoader: loadNodeExportImage,
    options,
    pageId,
    scene,
    strictAssets: options.strictAssets ?? true,
  });
  stage.destroy();
  return result;
}
