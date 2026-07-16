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
  it('toggles rulers and manages per-page guides', () => {
    const settings = new CanvasRulerGuidesSettings();
    expect(settings.isShowRulers()).toBe(true);

    settings.toggleRulers();
    expect(settings.isShowRulers()).toBe(false);

    const guide = settings.addGuide('page-1', {
      orientation: 'vertical',
      position: 120,
    });
    expect(settings.getGuidesForPage('page-1')).toEqual([guide]);
    expect(settings.getGuidesForPage('page-2')).toEqual([]);

    settings.moveGuide('page-1', guide.id, 200);
    expect(settings.getGuidesForPage('page-1')[0]?.position).toBe(200);

    settings.removeGuide('page-1', guide.id);
    expect(settings.getGuidesForPage('page-1')).toEqual([]);
  });

  it('clears guides for a page', () => {
    const settings = new CanvasRulerGuidesSettings();
    settings.addGuide('page-1', { orientation: 'horizontal', position: 40 });
    settings.addGuide('page-1', { orientation: 'vertical', position: 80 });
    settings.addGuide('page-2', { orientation: 'vertical', position: 10 });

    settings.clearPageGuides('page-1');
    expect(settings.getGuidesForPage('page-1')).toEqual([]);
    expect(settings.getGuidesForPage('page-2')).toHaveLength(1);
  });

  it('prunes guides for deleted pages', () => {
    const settings = new CanvasRulerGuidesSettings();
    settings.addGuide('page-1', { orientation: 'vertical', position: 10 });
    settings.addGuide('page-2', { orientation: 'horizontal', position: 20 });
    settings.pruneToPageIds(['page-2']);
    expect(settings.getGuidesForPage('page-1')).toEqual([]);
    expect(settings.getGuidesForPage('page-2')).toHaveLength(1);
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
