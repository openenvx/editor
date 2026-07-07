import { describe, expect, it } from 'vitest';

import { getLayerScreenBounds } from './layer-screen-bounds';

describe('layer-screen-bounds', () => {
  it('maps canvas transform to screen bounds with zoom and offset', () => {
    const bounds = getLayerScreenBounds(
      {
        height: 100,
        opacity: 1,
        rotation: 0,
        width: 200,
        x: 50,
        y: 25,
      },
      { panX: 0, panY: 0, zoom: 2 },
      { x: 100, y: 80 }
    );

    expect(bounds).toEqual({
      height: 200,
      left: 200,
      rotation: 0,
      top: 130,
      width: 400,
    });
  });
});
