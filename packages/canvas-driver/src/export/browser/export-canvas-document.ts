import type { Scene } from '@openenvx/studio/schema';

import type {
  CanvasExportOptions,
  CanvasExportResult,
} from '../canvas-document-export-service';
import { ensureBrowserExportFonts } from '../ensure-browser-export-fonts';
import { exportRenderEncode } from '../export-render-encode';
import { loadBrowserExportImage } from '../load-export-image';
import { assertBrowserExportFormat } from '../resolve-export-request';

export async function exportCanvasDocument(
  scene: Scene,
  pageId: string,
  options: CanvasExportOptions
): Promise<CanvasExportResult> {
  assertBrowserExportFormat(options.format);
  if (options.format !== 'png' && options.format !== 'jpg') {
    throw new Error(`Unsupported export format: ${options.format}`);
  }
  const { stage, result } = await exportRenderEncode({
    ensureFonts: ensureBrowserExportFonts,
    imageLoader: loadBrowserExportImage,
    options,
    pageId,
    scene,
    strictAssets: options.strictAssets ?? false,
  });
  stage.destroy();
  return result;
}
