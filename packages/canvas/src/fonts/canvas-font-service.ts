import type { FontDescriptor, FontService } from '@openenvx/core';

import { createSeedFontCatalog } from './canvas-font-catalog';

const fontsByFamily = new Map<string, FontDescriptor>();
const loadedFaceKeys = new Set<string>();

function seedRegistry(): void {
  if (fontsByFamily.size > 0) {
    return;
  }
  for (const font of createSeedFontCatalog()) {
    fontsByFamily.set(font.family, font);
  }
}

function faceKey(font: FontDescriptor): string {
  return `${font.family}::${font.src ?? ''}`;
}

function injectFontFace(font: FontDescriptor): void {
  if (!font.src || typeof document === 'undefined') {
    return;
  }
  const key = faceKey(font);
  if (loadedFaceKeys.has(key)) {
    return;
  }
  loadedFaceKeys.add(key);

  try {
    const face = new FontFace(font.id, `url(${font.src})`);
    document.fonts.add(face);
    void face.load().catch(() => {
      loadedFaceKeys.delete(key);
    });
  } catch {
    loadedFaceKeys.delete(key);
  }
}

seedRegistry();

export const canvasFontService: FontService = {
  list(): FontDescriptor[] {
    seedRegistry();
    return [...fontsByFamily.values()];
  },

  resolve(family: string): FontDescriptor | null {
    seedRegistry();
    return (
      fontsByFamily.get(family) ??
      [...fontsByFamily.values()].find((font) =>
        family.toLowerCase().includes(font.id.toLowerCase())
      ) ??
      null
    );
  },

  register(font: FontDescriptor): void {
    seedRegistry();
    fontsByFamily.set(font.family, font);
    injectFontFace(font);
  },
};

/** Test helper — clears runtime registrations and reseeds the catalog. */
export function resetCanvasFontServiceForTests(): void {
  fontsByFamily.clear();
  loadedFaceKeys.clear();
  seedRegistry();
}
