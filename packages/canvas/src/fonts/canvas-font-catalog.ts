import type { FontDescriptor } from '@openenvx/core';

import googleFontsCatalog from './google-fonts-catalog.json';

interface GoogleFontCatalogEntry {
  i: string;
  c: string;
  v: string[];
}

/** Canvas-owned catalog row (Google metadata stays out of core FontDescriptor). */
export interface CanvasFontCatalogEntry {
  id: string;
  family: string;
  category?: string;
  variants?: string[];
  src?: string;
}

/** Popular faces shown in the font picker before search; preloaded on editor mount. */
export const PRELOADED_GOOGLE_FONT_IDS: readonly string[] = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Source Sans 3',
  'Ubuntu',
  'Oswald',
  'Work Sans',
  'DM Sans',
  'Manrope',
  'Figtree',
  'Plus Jakarta Sans',
  'Playfair Display',
  'Merriweather',
  'Lora',
  'PT Serif',
  'Libre Baskerville',
  'Cormorant Garamond',
  'Roboto Slab',
  'Bebas Neue',
  'Anton',
  'Archivo Black',
  'Pacifico',
  'Dancing Script',
  'Great Vibes',
  'Parisienne',
  'Caveat',
  'Satisfy',
  'Permanent Marker',
  'Lobster',
  'Righteous',
  'Bangers',
  'Roboto Mono',
  'Source Code Pro',
  'Space Mono',
  'Inconsolata',
] as const;

function genericForCategory(category: string): string {
  if (category === 'serif') {
    return 'serif';
  }
  if (category === 'monospace') {
    return 'monospace';
  }
  if (category === 'handwriting' || category === 'display') {
    return 'cursive';
  }
  return 'sans-serif';
}

function cssFamilyStack(id: string, category: string): string {
  const generic = genericForCategory(category);
  return /\s/.test(id) ? `"${id}", ${generic}` : `${id}, ${generic}`;
}

function googleEntryToCatalog(
  entry: GoogleFontCatalogEntry
): CanvasFontCatalogEntry {
  return {
    category: entry.c,
    family: cssFamilyStack(entry.i, entry.c),
    id: entry.i,
    variants: entry.v,
  };
}

export function toFontDescriptor(
  entry: CanvasFontCatalogEntry
): FontDescriptor {
  return {
    family: entry.family,
    id: entry.id,
    ...(entry.src ? { src: entry.src } : {}),
  };
}

/** Bundled Google Fonts metadata (families + variant keys). Faces load on demand. */
export const GOOGLE_FONT_CATALOG: readonly CanvasFontCatalogEntry[] = (
  googleFontsCatalog as GoogleFontCatalogEntry[]
).map(googleEntryToCatalog);

const googleFontsById = new Map(
  GOOGLE_FONT_CATALOG.map((font) => [font.id.toLowerCase(), font] as const)
);

/** OS-provided fonts — no remote load; rely on the host system. */
export const SYSTEM_FONT_CATALOG: readonly CanvasFontCatalogEntry[] = [
  { id: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { id: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { id: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { id: 'Georgia', family: 'Georgia, serif' },
  { id: 'Courier New', family: '"Courier New", Courier, monospace' },
  { id: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { id: 'Trebuchet MS', family: '"Trebuchet MS", Helvetica, sans-serif' },
  { id: 'Palatino', family: '"Palatino Linotype", Palatino, serif' },
  { id: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
  { id: 'Impact', family: 'Impact, Haettenschweiler, sans-serif' },
] as const;

export const CANVAS_FONT_FAMILIES = GOOGLE_FONT_CATALOG.map(
  (font) => font.family
);

/** Featured picker list: preloaded Google faces + system fonts. */
export function createFeaturedFontCatalog(): CanvasFontCatalogEntry[] {
  const featured: CanvasFontCatalogEntry[] = [];
  const seen = new Set<string>();
  for (const id of PRELOADED_GOOGLE_FONT_IDS) {
    const font = googleFontsById.get(id.toLowerCase());
    if (!font || seen.has(font.id.toLowerCase())) {
      continue;
    }
    seen.add(font.id.toLowerCase());
    featured.push(font);
  }
  for (const font of SYSTEM_FONT_CATALOG) {
    if (seen.has(font.id.toLowerCase())) {
      continue;
    }
    seen.add(font.id.toLowerCase());
    featured.push(font);
  }
  return featured;
}

export function createSeedFontCatalog(): CanvasFontCatalogEntry[] {
  const byId = new Map<string, CanvasFontCatalogEntry>();
  for (const font of GOOGLE_FONT_CATALOG) {
    byId.set(font.id.toLowerCase(), font);
  }
  for (const font of SYSTEM_FONT_CATALOG) {
    if (!byId.has(font.id.toLowerCase())) {
      byId.set(font.id.toLowerCase(), font);
    }
  }
  return [...byId.values()];
}
