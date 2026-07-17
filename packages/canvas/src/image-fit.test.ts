import { describe, expect, it } from 'vitest';

import { computeImageFitLayout } from './image-fit';

describe('computeImageFitLayout', () => {
  it('fill stretches to the full box', () => {
    const layout = computeImageFitLayout(
      { height: 100, width: 200 },
      { height: 50, width: 50 },
      'fill'
    );
    expect(layout.draw).toEqual({ height: 50, width: 50, x: 0, y: 0 });
    expect(layout.crop).toBeUndefined();
  });

  it('contain letterboxes a wide image', () => {
    const layout = computeImageFitLayout(
      { height: 100, width: 200 },
      { height: 100, width: 100 },
      'contain'
    );
    expect(layout.draw.width).toBeCloseTo(100);
    expect(layout.draw.height).toBeCloseTo(50);
    expect(layout.draw.x).toBeCloseTo(0);
    expect(layout.draw.y).toBeCloseTo(25);
  });

  it('cover crops with center focal point', () => {
    const layout = computeImageFitLayout(
      { height: 100, width: 200 },
      { height: 100, width: 100 },
      'cover',
      { x: 0.5, y: 0.5 }
    );
    expect(layout.draw).toEqual({ height: 100, width: 100, x: 0, y: 0 });
    expect(layout.crop).toEqual({ height: 100, width: 100, x: 50, y: 0 });
  });

  it('cover respects left focal point', () => {
    const layout = computeImageFitLayout(
      { height: 100, width: 200 },
      { height: 100, width: 100 },
      'cover',
      { x: 0, y: 0.5 }
    );
    expect(layout.crop?.x).toBeCloseTo(0);
  });

  it('undefined fit behaves as fill', () => {
    const layout = computeImageFitLayout(
      { height: 10, width: 10 },
      { height: 20, width: 30 }
    );
    expect(layout.draw).toEqual({ height: 20, width: 30, x: 0, y: 0 });
  });
});
