import { describe, expect, it } from 'vitest';

import {
  canvasFontService,
  resetCanvasFontServiceForTests,
} from './canvas-font-service';

describe('canvasFontService', () => {
  it('lists seeded catalog and system fonts', () => {
    resetCanvasFontServiceForTests();
    const list = canvasFontService.list();
    expect(list.some((font) => font.id === 'Inter')).toBe(true);
    expect(list.some((font) => font.id === 'Arial')).toBe(true);
  });

  it('register upserts a custom font', () => {
    resetCanvasFontServiceForTests();
    canvasFontService.register({
      family: 'Custom Display, sans-serif',
      id: 'Custom Display',
      src: 'https://example.com/custom.woff2',
    });
    expect(canvasFontService.resolve('Custom Display, sans-serif')?.id).toBe(
      'Custom Display'
    );
    expect(
      canvasFontService.list().some((font) => font.id === 'Custom Display')
    ).toBe(true);
  });
});
