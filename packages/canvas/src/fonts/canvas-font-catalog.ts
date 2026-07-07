import type { FontDescriptor } from '@openenvx/core';

export const CANVAS_FONT_CATALOG: readonly FontDescriptor[] = [
  { id: 'Inter', family: 'Inter, sans-serif' },
  { id: 'Parisienne', family: '"Parisienne", cursive' },
  {
    id: 'Cormorant Garamond',
    family: '"Cormorant Garamond", serif',
  },
] as const;

export const CANVAS_FONT_FAMILIES = CANVAS_FONT_CATALOG.map(
  (font) => font.family
);
