import { describe, expect, it } from 'vitest';

import { composeCanvasOverlays } from './use-canvas-overlays';

describe('composeCanvasOverlays', () => {
  it('includes a grid primitive when showGrid is enabled', () => {
    const primitives = composeCanvasOverlays({
      artboardHeight: 800,
      artboardWidth: 600,
      bleedEdge: null,
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
      bleedEdge: null,
      gridSize: 8,
      marginInset: null,
      showGrid: false,
      showMargins: false,
    });
    expect(primitives).toEqual([]);
  });

  it('draws bleed edge under safe margin when both enabled', () => {
    const primitives = composeCanvasOverlays({
      artboardHeight: 800,
      artboardWidth: 600,
      bleedEdge: { height: 800, width: 600, x: 0, y: 0 },
      gridSize: 8,
      interactionOverlays: [{ kind: 'line', points: [0, 0, 10, 10] }],
      marginInset: { height: 700, width: 500, x: 50, y: 50 },
      showGrid: true,
      showMargins: true,
    });
    expect(primitives[0]?.kind).toBe('grid');
    expect(primitives[1]?.kind).toBe('line');
    expect(primitives[2]).toMatchObject({
      height: 800,
      kind: 'rect',
      width: 600,
      x: 0,
      y: 0,
    });
    expect(primitives[3]).toMatchObject({
      height: 700,
      kind: 'rect',
      width: 500,
      x: 50,
      y: 50,
    });
  });
});
