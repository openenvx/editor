import { describe, expect, it } from 'vitest';

import { CanvasRulerGuidesSettings } from './canvas-ruler-guides-settings';
import {
  buildRulerTicks,
  computeRulerTickStep,
  isGuideWithinArtboard,
  screenToArtboardPoint,
  userGuidesToSnapAxes,
} from './ruler-math';

describe('CanvasRulerGuidesSettings', () => {
  it('toggles rulers visibility only', () => {
    const settings = new CanvasRulerGuidesSettings();
    expect(settings.isShowRulers()).toBe(true);
    expect(settings.getSnapshot()).toEqual({ showRulers: true });

    settings.toggleRulers();
    expect(settings.isShowRulers()).toBe(false);
  });
});

describe('ruler-math', () => {
  it('picks a tick step that grows as zoom shrinks', () => {
    expect(computeRulerTickStep(1)).toBeLessThanOrEqual(100);
    expect(computeRulerTickStep(0.25)).toBeGreaterThan(
      computeRulerTickStep(1)
    );
  });

  it('converts screen coordinates to artboard space', () => {
    expect(
      screenToArtboardPoint(150, 80, { x: 50, y: 20 }, 2)
    ).toEqual({ x: 50, y: 30 });
  });

  it('builds ticks within the visible view', () => {
    const ticks = buildRulerTicks({
      artboardSize: 600,
      offset: 100,
      viewEnd: 400,
      viewStart: 0,
      zoom: 1,
    });
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.some((tick) => tick.major && tick.label)).toBe(true);
  });

  it('splits guides into snap axes', () => {
    expect(
      userGuidesToSnapAxes([
        { id: 'v1', orientation: 'vertical', position: 10 },
        { id: 'h1', orientation: 'horizontal', position: 20 },
      ])
    ).toEqual({ xs: [10], ys: [20] });
  });

  it('detects whether a guide is within the artboard', () => {
    expect(isGuideWithinArtboard('vertical', 0, 600, 800)).toBe(true);
    expect(isGuideWithinArtboard('vertical', 601, 600, 800)).toBe(false);
    expect(isGuideWithinArtboard('horizontal', 800, 600, 800)).toBe(true);
    expect(isGuideWithinArtboard('horizontal', -1, 600, 800)).toBe(false);
  });
});
