import { describe, expect, it } from 'vitest';

import {
  applyGridSnapToDragPosition,
  applyGridSnapToResizeBox,
  snapPointToGrid,
  snapValueToGrid,
} from './grid-snap';

describe('grid-snap', () => {
  it('snaps values to nearest grid line', () => {
    expect(snapValueToGrid(13, 8)).toBe(16);
    expect(snapValueToGrid(11, 8)).toBe(8);
    expect(snapValueToGrid(12, 8)).toBe(16);
    expect(snapValueToGrid(0, 8)).toBe(0);
  });

  it('snaps points on both axes', () => {
    expect(snapPointToGrid(13, 21, 8)).toEqual({ x: 16, y: 24 });
  });

  it('applies grid only on axes guides did not move', () => {
    expect(
      applyGridSnapToDragPosition({
        originalX: 13,
        originalY: 21,
        size: 8,
        snappedX: 13,
        snappedY: 21,
      })
    ).toEqual({ x: 16, y: 24 });

    expect(
      applyGridSnapToDragPosition({
        originalX: 13,
        originalY: 21,
        size: 8,
        snappedX: 100,
        snappedY: 21,
      })
    ).toEqual({ x: 100, y: 24 });
  });

  it('snaps resize edges to grid when guides did not change that axis', () => {
    const original = {
      height: 100,
      rotation: 0,
      width: 100,
      x: 10,
      y: 12,
    };
    expect(
      applyGridSnapToResizeBox({
        anchor: 'middle-right',
        original,
        size: 8,
        snapped: original,
      })
    ).toEqual({
      height: 100,
      rotation: 0,
      width: 102,
      x: 10,
      y: 12,
    });

    expect(
      applyGridSnapToResizeBox({
        anchor: 'bottom-left',
        original,
        size: 8,
        snapped: original,
      })
    ).toEqual({
      height: 100,
      rotation: 0,
      width: 102,
      x: 8,
      y: 12,
    });
  });

  it('keeps guide-snapped resize axes unchanged', () => {
    const original = {
      height: 100,
      rotation: 0,
      width: 100,
      x: 10,
      y: 12,
    };
    const guideSnapped = {
      ...original,
      width: 120,
    };
    expect(
      applyGridSnapToResizeBox({
        anchor: 'middle-right',
        original,
        size: 8,
        snapped: guideSnapped,
      })
    ).toEqual(guideSnapped);
  });
});
