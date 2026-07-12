import { CANVAS_FONT_FAMILIES } from './fonts/canvas-font-catalog';
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

  return [...new Set([...CANVAS_FONT_FAMILIES, ...fromLayers])];
}
