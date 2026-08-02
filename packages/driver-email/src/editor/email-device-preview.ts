import type { HtmlDevicePreset } from '@openenvx/html';

/**
 * Standard email content width (px). The artboard may be wider (device preview);
 * `email.root` keeps the white card at this max-width, centered.
 */
export const EMAIL_FRAME_WIDTH = 600;

/** Visible body chrome outside the white card (total, both sides). */
const EMAIL_BODY_GUTTER = 80;

/**
 * Email preview frames stay close to the design width so the card reads large.
 * Mobile is a phone viewport; tablet/desktop only add a slim body margin.
 */
export const EMAIL_DEVICE_WIDTHS: Record<
  Exclude<HtmlDevicePreset, 'fluid'>,
  number
> = {
  mobile: 390,
  tablet: EMAIL_FRAME_WIDTH + EMAIL_BODY_GUTTER,
  desktop: EMAIL_FRAME_WIDTH + EMAIL_BODY_GUTTER,
};

export function resolveEmailFrameWidth(
  preset: HtmlDevicePreset,
  availableWidth: number
): number {
  if (preset === 'fluid') {
    return Math.max(0, availableWidth);
  }
  return EMAIL_DEVICE_WIDTHS[preset];
}
