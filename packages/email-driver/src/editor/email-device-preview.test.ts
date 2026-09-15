import { describe, expect, it } from 'vitest';

import {
  EMAIL_DEVICE_WIDTHS,
  EMAIL_FRAME_WIDTH,
  resolveEmailFrameWidth,
} from './email-device-preview';

describe('resolveEmailFrameWidth', () => {
  it('keeps desktop just wider than the 640px artboard', () => {
    expect(EMAIL_FRAME_WIDTH).toBe(640);
    expect(EMAIL_DEVICE_WIDTHS.desktop).toBe(EMAIL_FRAME_WIDTH + 80);
    expect(resolveEmailFrameWidth('desktop', 1200)).toBe(720);
    expect(resolveEmailFrameWidth('mobile', 1200)).toBe(390);
    expect(resolveEmailFrameWidth('fluid', 900)).toBe(900);
  });
});
