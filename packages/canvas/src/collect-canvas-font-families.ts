import type { LayerSurfaceItem } from '@openenvx/headless';

import { CANVAS_FONT_FAMILIES } from './fonts/canvas-font-catalog';

export function collectCanvasFontFamilies(
  layerSurface: LayerSurfaceItem[]
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
