import { collectCanvasFontFamilies } from '../collect-canvas-font-families';
import type { CanvasLayerSurfaceItem } from '../layer-surface-item';

function walkSurface(
  items: CanvasLayerSurfaceItem[],
  visit: (item: CanvasLayerSurfaceItem) => void
): void {
  for (const item of items) {
    visit(item);
    if (item.children?.length) {
      walkSurface(item.children, visit);
    }
  }
}

export function collectExportFontFamilies(
  surface: CanvasLayerSurfaceItem[]
): string[] {
  const items: CanvasLayerSurfaceItem[] = [];
  walkSurface(surface, (item) => {
    items.push(item);
  });
  return collectCanvasFontFamilies(items);
}
