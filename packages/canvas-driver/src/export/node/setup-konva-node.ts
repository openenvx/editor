import { loadImage } from '@napi-rs/canvas';

import { createKonvaCompatibleCanvas } from '../create-konva-compatible-canvas';
import { ensureKonvaCanvasBackend } from '../ensure-konva-canvas-backend';
import { assertExportImageUrlAllowed } from '../validate-export-image-url';

let configured = false;

export function ensureKonvaNodeBackend(): void {
  if (configured) {
    return;
  }
  ensureKonvaCanvasBackend(() => createKonvaCompatibleCanvas());
  configured = true;
}

export async function loadNodeExportImage(
  src: string
): Promise<CanvasImageSource | null> {
  if (!src) {
    return null;
  }
  try {
    assertExportImageUrlAllowed(src);
    return (await loadImage(src)) as unknown as CanvasImageSource;
  } catch {
    return null;
  }
}
