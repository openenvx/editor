import type { CanvasLayerSurfaceItem } from './layer-surface-item';

const FONT_FAMILY_STYLE_RE = /font-family\s*:\s*([^;}"]+)/gi;

function familiesFromHtml(html: string | undefined): string[] {
  if (!html) {
    return [];
  }
  const found: string[] = [];
  for (const match of html.matchAll(FONT_FAMILY_STYLE_RE)) {
    const value = match[1]?.trim();
    if (value) {
      found.push(value);
    }
  }
  return found;
}

/** Families used by the current scene (layer default + inline rich-text spans). */
export function collectCanvasFontFamilies(
  layerSurface: CanvasLayerSurfaceItem[]
): string[] {
  const fromLayers = layerSurface.flatMap((item) => {
    if (item.layer.type !== 'canvas.text') {
      return [];
    }
    const data = item.layer.data as {
      fontFamily?: string;
      html?: string;
    };
    return [
      ...(data.fontFamily ? [data.fontFamily] : []),
      ...familiesFromHtml(data.html),
    ];
  });

  return [...new Set(fromLayers.filter(Boolean))];
}
