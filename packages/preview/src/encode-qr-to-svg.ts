import type { CanvasQrData } from '@xmazu/openenvxee-schema';
import { renderSVG } from 'uqr';

export type { QrErrorCorrection } from '@xmazu/openenvxee-schema';

/** Encode options = QR layer data minus the payload string. */
export type EncodeQrToSvgOptions = Omit<CanvasQrData, 'url'>;

const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="QR placeholder">' +
  '<rect width="24" height="24" fill="#f3f4f6"/>' +
  '<rect x="3" y="3" width="18" height="18" fill="none" stroke="#9ca3af" stroke-width="1.5"/>' +
  '<line x1="5" y1="5" x2="19" y2="19" stroke="#9ca3af" stroke-width="1.5"/>' +
  '<text x="12" y="13.5" text-anchor="middle" font-size="4" fill="#6b7280" font-family="system-ui,sans-serif">QR</text>' +
  '</svg>';

/**
 * Encode a payload string as an SVG QR code. Empty/whitespace payloads return
 * a stable placeholder so canvas/export never crash on incomplete templates.
 */
export function encodeQrToSvg(
  url: string,
  options: EncodeQrToSvgOptions = {}
): string {
  const payload = url.trim();
  if (!payload) {
    return PLACEHOLDER_SVG;
  }

  try {
    return renderSVG(payload, {
      blackColor: options.foreground ?? '#000000',
      border: options.margin ?? 1,
      ecc: options.errorCorrection ?? 'M',
      whiteColor: options.background ?? '#ffffff',
    });
  } catch {
    return PLACEHOLDER_SVG;
  }
}
