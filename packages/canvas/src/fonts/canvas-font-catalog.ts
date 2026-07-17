import type { FontDescriptor } from '@openenvx/core';

export const CANVAS_FONT_CATALOG: readonly FontDescriptor[] = [
  { id: 'Inter', family: 'Inter, sans-serif' },
  { id: 'Parisienne', family: '"Parisienne", cursive' },
  {
    id: 'Cormorant Garamond',
    family: '"Cormorant Garamond", serif',
  },
] as const;

/** OS-provided fonts — no `src`; rely on the host system. */
export const SYSTEM_FONT_CATALOG: readonly FontDescriptor[] = [
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

export const CANVAS_FONT_FAMILIES = CANVAS_FONT_CATALOG.map(
  (font) => font.family
);

export function createSeedFontCatalog(): FontDescriptor[] {
  return [...CANVAS_FONT_CATALOG, ...SYSTEM_FONT_CATALOG];
}
