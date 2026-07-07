import { describe, expect, it } from 'vitest';

import { clampTransformSize, MIN_LAYER_SIZE } from './transform-utils';

describe('transform-utils', () => {
  it('clamps width and height to minimum layer size', () => {
    const result = clampTransformSize({
      height: 2,
      opacity: 1,
      rotation: 0,
      width: -4,
      x: 0,
      y: 0,
    });
    expect(result.width).toBe(MIN_LAYER_SIZE);
    expect(result.height).toBe(MIN_LAYER_SIZE);
  });
});
