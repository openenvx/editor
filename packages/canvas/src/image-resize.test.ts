import { describe, expect, it } from 'vitest';

import { boundImageCornerBox } from './image-resize';

describe('boundImageCornerBox', () => {
  const origin = {
    height: 200,
    rotation: 0,
    width: 400,
    x: 100,
    y: 50,
  };

  const oldBox = { ...origin };

  it('locks aspect ratio for bottom-right corner resize', () => {
    const next = boundImageCornerBox(
      origin,
      'bottom-right',
      oldBox,
      { ...oldBox, height: 300, width: 500 },
      false
    );

    expect(next.width / next.height).toBeCloseTo(2, 5);
    expect(next.x).toBe(origin.x);
    expect(next.y).toBe(origin.y);
  });

  it('allows free stretch when shift is held', () => {
    const next = boundImageCornerBox(
      origin,
      'bottom-right',
      oldBox,
      { ...oldBox, height: 300, width: 500 },
      true
    );

    expect(next.width).toBe(500);
    expect(next.height).toBe(300);
  });
});
