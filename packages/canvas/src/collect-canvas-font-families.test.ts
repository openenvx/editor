import { describe, expect, it } from 'vitest';

import { collectCanvasFontFamilies } from './collect-canvas-font-families';
import type { CanvasLayerSurfaceItem } from './layer-surface-item';

describe('collectCanvasFontFamilies', () => {
  it('collects layer default and inline html families only', () => {
    const layerSurface = [
      {
        layer: {
          data: {
            fontFamily: 'Roboto, sans-serif',
            html: '<p><span style="font-family: Georgia">Hi</span></p>',
          },
          id: 't1',
          type: 'canvas.text',
        },
      },
      {
        layer: {
          data: { src: 'x.png' },
          id: 'i1',
          type: 'canvas.image',
        },
      },
    ] as unknown as CanvasLayerSurfaceItem[];

    expect(collectCanvasFontFamilies(layerSurface).toSorted()).toEqual([
      'Georgia',
      'Roboto, sans-serif',
    ]);
  });
});
