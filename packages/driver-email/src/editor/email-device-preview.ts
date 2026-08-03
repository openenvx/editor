import type { HtmlDevicePreset } from '@openenvx/html';

/**
 * Email artboard design width (px). Device frames may be wider;
 * `email.root` centers content with editable `maxWidth` (default 600).
 */
export const EMAIL_FRAME_WIDTH = 640;

/** Visible body chrome outside the content column (total, both sides). */
const EMAIL_BODY_GUTTER = 80;

/**
 * Email preview frames stay close to the design width so content reads large.
 * Mobile is a phone viewport; desktop only adds a slim body margin (→ 720).
 */
export const EMAIL_DEVICE_WIDTHS: Record<
  Exclude<HtmlDevicePreset, 'fluid'>,
  number
> = {
  mobile: 390,
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
