import { describe, expect, it } from 'vitest';

import { CanvasGridSettings } from '../grid/canvas-grid-settings';
import {
  CANVAS_GRID_SIZE_PRESETS,
  SetCanvasGridSizeCommand,
} from './canvas-grid-commands';

describe('SetCanvasGridSizeCommand', () => {
  it('exposes 4/8/16/32 presets', () => {
    expect([...CANVAS_GRID_SIZE_PRESETS]).toEqual([4, 8, 16, 32]);
  });

  it('sets size from { size } args', () => {
    const settings = new CanvasGridSettings();
    const services = {
      has: () => true,
      get: () => settings,
    };
    const ctx = { services } as never;

    new SetCanvasGridSizeCommand().execute(ctx, { size: 16 });
    expect(settings.getSize()).toBe(16);
  });
});
