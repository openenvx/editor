import { describe, expect, it } from 'vitest';

import { resolvePagePreset, toPx } from '@openenvx/schema';

import {
  computeDragSnap,
  computeResizeSnap,
  computeSnapThreshold,
  snapBoundsFromTransform,
  toSnapBounds,
} from './smart-guides';
import {
  computePageSafeBounds,
  PRINT_MARGIN_MM,
} from '../page-margins';

describe('smart-guides', () => {
  it('snaps center to artboard horizontal center', () => {
    const artboard = { height: 800, width: 600 };
    const result = computeDragSnap({
      artboard,
      height: 100,
      others: [],
      threshold: 10,
      width: 100,
      x: 248,
      y: 100,
    });
    expect(result.x).toBe(250);
    const guide = result.guides.find((entry) => entry.orientation === 'v');
    expect(guide).toBeDefined();
    expect(guide?.fullSpan).toBe(true);
    expect(guide?.extent).toEqual([0, 800]);
  });

  it('snaps left edge to another layer left edge', () => {
    const other = toSnapBounds(100, 200, 80, 60);
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      height: 60,
      others: [other],
      threshold: 5,
      width: 80,
      x: 102,
      y: 300,
    });
    expect(result.x).toBe(100);
    expect(result.guides.length).toBeGreaterThan(0);
  });

  it('does not snap when outside threshold', () => {
    const other = toSnapBounds(100, 200, 80, 60);
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      height: 60,
      others: [other],
      threshold: 2,
      width: 80,
      x: 145,
      y: 300,
    });
    expect(result.x).toBe(145);
    expect(result.guides).toHaveLength(0);
  });

  it('detects equal horizontal spacing between three layers', () => {
    const left = toSnapBounds(0, 0, 50, 50);
    const right = toSnapBounds(200, 0, 50, 50);
    const result = computeDragSnap({
      artboard: { height: 800, width: 600 },
      height: 50,
      others: [left, right],
      threshold: 5,
      width: 50,
      x: 102,
      y: 0,
    });
    expect(result.x).toBe(100);
    expect(result.spacing.some((entry) => entry.axis === 'x')).toBeTruthy();
  });

  it('scales threshold inversely with zoom', () => {
    expect(computeSnapThreshold(1)).toBe(5);
    expect(computeSnapThreshold(2)).toBe(2.5);
  });

  it('snaps resize right edge to artboard edge', () => {
    const result = computeResizeSnap({
      anchor: 'middle-right',
      artboard: { height: 800, width: 600 },
      box: {
        height: 100,
        rotation: 0,
        width: 198,
        x: 100,
        y: 100,
      },
      others: [],
      threshold: 5,
    });
    expect(result.box.width).toBe(200);
    expect(result.box.x).toBe(100);
  });

  it('snapBoundsFromTransform maps transform to bounds', () => {
    const bounds = snapBoundsFromTransform({
      height: 80,
      opacity: 1,
      rotation: 0,
      width: 120,
      x: 10,
      y: 20,
    });
    expect(bounds.left).toBe(10);
    expect(bounds.top).toBe(20);
    expect(bounds.right).toBe(130);
    expect(bounds.bottom).toBe(100);
  });
});

describe('page-margins', () => {
  it('returns safe bounds inset for A4 at 96 dpi', () => {
    const preset = resolvePagePreset('a4-portrait')!;
    const bounds = computePageSafeBounds({
      height: preset.height,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      width: preset.width,
    });
    const inset = Math.round(toPx(PRINT_MARGIN_MM, 'mm', 96));
    expect(bounds?.left).toBe(inset);
    expect(bounds?.top).toBe(inset);
    expect(bounds?.right).toBe(preset.width - inset);
    expect(bounds?.bottom).toBe(preset.height - inset);
  });

  it('returns null for custom page sizes', () => {
    const bounds = computePageSafeBounds({
      height: 500,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      width: 700,
    });
    expect(bounds).toBeNull();
  });
});
