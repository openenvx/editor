import type { CanvasLayerSurfaceItem } from '../../layer-surface-item';
import { collectExportFontFamilies } from '../collect-export-font-families';
import { loadNodeExportFonts } from './load-node-export-fonts';

export async function ensureNodeExportFonts(
  surface: CanvasLayerSurfaceItem[]
): Promise<void> {
  const families = collectExportFontFamilies(surface);
  if (families.length === 0) {
    return;
  }
  await loadNodeExportFonts(families);
}
