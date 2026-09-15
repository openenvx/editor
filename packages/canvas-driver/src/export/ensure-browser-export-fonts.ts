import { loadCanvasFonts } from '../fonts/load-canvas-fonts';
import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { collectExportFontFamilies } from './collect-export-font-families';

export async function ensureBrowserExportFonts(
  surface: CanvasLayerSurfaceItem[]
): Promise<void> {
  const families = collectExportFontFamilies(surface);
  await loadCanvasFonts(families);
}
