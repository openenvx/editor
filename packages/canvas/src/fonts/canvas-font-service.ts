import type { FontDescriptor, FontService } from '@openenvx/core';

import { CANVAS_FONT_CATALOG } from './canvas-font-catalog';

export const canvasFontService: FontService = {
  list(): FontDescriptor[] {
    return [...CANVAS_FONT_CATALOG];
  },

  resolve(family: string): FontDescriptor | null {
    return (
      CANVAS_FONT_CATALOG.find((font) => font.family === family) ??
      CANVAS_FONT_CATALOG.find((font) =>
        family.toLowerCase().includes(font.id.toLowerCase())
      ) ??
      null
    );
  },
};
