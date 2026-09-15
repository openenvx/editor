import { describe, expect, it } from 'vitest';

import {
  canvasFontService,
  resetCanvasFontServiceForTests,
} from './canvas-font-service';

describe('canvasFontService', () => {
  it('lists google + system fonts', () => {
    resetCanvasFontServiceForTests();
    const list = canvasFontService.list();
    expect(list.length).toBeGreaterThan(1000);
    expect(list.some((font) => font.id === 'Roboto')).toBe(true);
    expect(list.some((font) => font.id === 'Arial')).toBe(true);
  });

  it('lists featured faces separately from the full catalog', () => {
    resetCanvasFontServiceForTests();
    const featured = canvasFontService.listFeatured();
    expect(featured.length).toBeGreaterThan(10);
    expect(featured.length).toBeLessThan(canvasFontService.list().length);
    expect(featured.some((font) => font.id === 'Inter')).toBe(true);
  });

  it('resolves family stacks and bare ids', () => {
    resetCanvasFontServiceForTests();
    expect(canvasFontService.resolve('Roboto, sans-serif')?.id).toBe('Roboto');
    expect(canvasFontService.resolve('"Open Sans", sans-serif')?.id).toBe(
      'Open Sans'
    );
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
