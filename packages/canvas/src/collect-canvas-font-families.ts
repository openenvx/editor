import { canvasFontService } from './fonts/canvas-font-service';
import type { CanvasLayerSurfaceItem } from './layer-surface-item';

export function collectCanvasFontFamilies(
  layerSurface: CanvasLayerSurfaceItem[]
): string[] {
  const fromLayers = layerSurface
    .filter((item) => item.layer.type === 'canvas.text')
    .map((item) => {
      const data = item.layer.data as { fontFamily?: string };
      return data.fontFamily;
    })
    .filter((family): family is string => Boolean(family));

  const fromService = canvasFontService.list().map((font) => font.family);

  return [...new Set([...fromService, ...fromLayers])];
}
