import type { FontDescriptor, FontService } from '@openenvx/core';

import {
  createFeaturedFontCatalog,
  createSeedFontCatalog,
  toFontDescriptor,
  type CanvasFontCatalogEntry,
} from './canvas-font-catalog';
import {
  buildGoogleFontsCss2Href,
  buildGoogleFontsCss2HrefBatch,
  pickGoogleFontLoadVariants,
} from './google-font-variant';

const fontsByFamily = new Map<string, FontDescriptor>();
const fontsById = new Map<string, FontDescriptor>();
/** Google (or provider) face keys - canvas-private, not on core FontDescriptor. */
const variantsById = new Map<string, string[]>();
const loadedFaceKeys = new Set<string>();
const stylesheetPromises = new Map<string, Promise<void>>();
const ensurePromises = new Map<string, Promise<void>>();
let featuredPreloadPromise: Promise<void> | null = null;
let seeded = false;

function rememberEntry(entry: CanvasFontCatalogEntry): FontDescriptor {
  const descriptor = toFontDescriptor(entry);
  fontsByFamily.set(descriptor.family, descriptor);
  fontsById.set(descriptor.id.toLowerCase(), descriptor);
  if (entry.variants && entry.variants.length > 0) {
    variantsById.set(descriptor.id, entry.variants);
  }
  return descriptor;
}

function seedRegistry(): void {
  if (seeded) {
    return;
  }
  seeded = true;
  for (const entry of createSeedFontCatalog()) {
    rememberEntry(entry);
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

function injectStylesheetLink(href: string, dataKey: string): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.resolve();
  }
  const existing = stylesheetPromises.get(dataKey);
  if (existing) {
    return existing;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const prior = document.querySelector<HTMLLinkElement>(
      `link[data-openenvx-font="${CSS.escape(dataKey)}"]`
    );
    if (prior) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.openenvxFont = dataKey;
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener(
      'error',
      () => {
        stylesheetPromises.delete(dataKey);
        link.remove();
        reject(new Error(`Failed to load Google Font stylesheet: ${dataKey}`));
      },
      { once: true }
    );
    document.head.append(link);
  });

  stylesheetPromises.set(dataKey, promise);
  return promise;
}

function injectGoogleStylesheet(font: FontDescriptor): Promise<void> {
  const variants = variantsById.get(font.id) ?? [];
  if (variants.length === 0) {
    return Promise.resolve();
  }
  const loadVariants = pickGoogleFontLoadVariants(variants);
  const href = buildGoogleFontsCss2Href(font.id, loadVariants);
  return injectStylesheetLink(href, font.id);
}

function preloadFeaturedFonts(): Promise<void> {
  if (featuredPreloadPromise) {
    return featuredPreloadPromise;
  }
  if (typeof document === 'undefined') {
    featuredPreloadPromise = Promise.resolve();
    return featuredPreloadPromise;
  }

  seedRegistry();
  const featured = createFeaturedFontCatalog().filter(
    (font) => (font.variants?.length ?? 0) > 0
  );
  const href = buildGoogleFontsCss2HrefBatch(
    featured.map((font) => ({
      family: font.id,
      variants: pickGoogleFontLoadVariants(font.variants ?? []),
    }))
  );

  featuredPreloadPromise = (async () => {
    if (!href) {
      return;
    }
    await injectStylesheetLink(href, 'featured-batch');
    for (const font of featured) {
      if (!stylesheetPromises.has(font.id)) {
        stylesheetPromises.set(font.id, Promise.resolve());
      }
    }
  })().catch(() => {
    featuredPreloadPromise = null;
  });

  return featuredPreloadPromise;
}

function resolveFont(family: string): FontDescriptor | null {
  seedRegistry();
  const trimmed = family.trim();
  if (!trimmed) {
    return null;
  }

  const direct = fontsByFamily.get(trimmed);
  if (direct) {
    return direct;
  }

  const unquoted = trimmed.replaceAll(/^["']|["']$/g, '');
  const primary = unquoted
    .split(',')[0]
    ?.trim()
    .replaceAll(/^["']|["']$/g, '');
  if (!primary) {
    return null;
  }
  return fontsById.get(primary.toLowerCase()) ?? null;
}

async function ensureFontLoaded(family: string): Promise<void> {
  const font = resolveFont(family);
  if (!font) {
    return;
  }

  const key = font.id;
  const inflight = ensurePromises.get(key);
  if (inflight) {
    return inflight;
  }

  const task = (async () => {
    if (font.src) {
      injectFontFace(font);
      return;
    }
    if ((variantsById.get(font.id)?.length ?? 0) > 0) {
      await injectGoogleStylesheet(font);
    }
  })().finally(() => {
    ensurePromises.delete(key);
  });

  ensurePromises.set(key, task);
  return task;
}

/** Kick featured CSS2 preload (call from editor mount, not module evaluate). */
export function preloadCanvasFeaturedFonts(): Promise<void> {
  return preloadFeaturedFonts();
}

export const canvasFontService: FontService = {
  list(): FontDescriptor[] {
    seedRegistry();
    return [...fontsByFamily.values()];
  },

  listFeatured(): FontDescriptor[] {
    seedRegistry();
    return createFeaturedFontCatalog().map(toFontDescriptor);
  },

  resolve(family: string): FontDescriptor | null {
    return resolveFont(family);
  },

  register(font: FontDescriptor): void {
    seedRegistry();
    fontsByFamily.set(font.family, font);
    fontsById.set(font.id.toLowerCase(), font);
    injectFontFace(font);
  },

  ensureLoaded(family: string): Promise<void> {
    return ensureFontLoaded(family);
  },
};

/** Test helper - clears runtime registrations and reseeds the catalog. */
export function resetCanvasFontServiceForTests(): void {
  fontsByFamily.clear();
  fontsById.clear();
  variantsById.clear();
  loadedFaceKeys.clear();
  stylesheetPromises.clear();
  ensurePromises.clear();
  featuredPreloadPromise = null;
  seeded = false;
  seedRegistry();
}
