import { describe, expect, it } from 'vitest';

import { composeCanvasOverlays } from './use-canvas-overlays';

describe('composeCanvasOverlays', () => {
  it('includes a grid primitive when showGrid is enabled', () => {
    const primitives = composeCanvasOverlays({
      artboardHeight: 800,
      artboardWidth: 600,
      gridSize: 8,
      marginInset: null,
      showGrid: true,
      showMargins: false,
    });
    expect(primitives).toEqual([
      {
        height: 800,
        kind: 'grid',
        size: 8,
        width: 600,
      },
    ]);
  });

  it('omits grid when disabled', () => {
    const primitives = composeCanvasOverlays({
      artboardHeight: 800,
      artboardWidth: 600,
      gridSize: 8,
      marginInset: null,
      showGrid: false,
      showMargins: false,
    });
    expect(primitives).toEqual([]);
  });

  it('draws grid under interaction overlays and margins on top', () => {
    const primitives = composeCanvasOverlays({
      artboardHeight: 800,
      artboardWidth: 600,
      gridSize: 8,
      interactionOverlays: [
        { kind: 'line', points: [0, 0, 10, 10] },
      ],
      marginInset: { height: 700, width: 500, x: 50, y: 50 },
      showGrid: true,
      showMargins: true,
    });
    expect(primitives[0]?.kind).toBe('grid');
    expect(primitives[1]?.kind).toBe('line');
    expect(primitives[2]?.kind).toBe('rect');
  });
});
