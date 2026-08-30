import type Konva from 'konva';

import { ROTATER_ANCHOR } from './geometry';

/** Pixel size of the custom rotater handle (circle + Lucide RefreshCw). */
export const TRANSFORMER_ROTATE_ANCHOR_SIZE = 22;
/** Gap between the selection box and the rotater handle (Konva `rotateAnchorOffset` padding). */
export const TRANSFORMER_ROTATE_ANCHOR_OFFSET = 8;

const DEFAULT_ROTATE_ANCHOR_STROKE = '#3b82f6';

const SAFE_CSS_COLOR =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\)|rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\))$/;

function resolveRotateAnchorStrokeColor(strokeColor: string): string {
  const trimmed = strokeColor.trim();
  return SAFE_CSS_COLOR.test(trimmed) ? trimmed : DEFAULT_ROTATE_ANCHOR_STROKE;
}

/**
 * Lucide `refresh-cw` paths (24×24 viewBox) - ISC license.
 * @see https://lucide.dev/icons/refresh-cw
 */
const REFRESH_CW_PATHS = [
  'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
  'M21 3v5h-5',
  'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
  'M8 16H3v5',
] as const;

export function createRotateAnchorSvgDataUrl(strokeColor: string): string {
  const stroke = resolveRotateAnchorStrokeColor(strokeColor);
  const paths = REFRESH_CW_PATHS.map(
    (d) =>
      `<path d="${d}" fill="none" stroke="#0a0a0a" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="#ffffff" stroke="${stroke}" stroke-width="2.5"/>
  <g transform="translate(16 16) scale(0.72) translate(-12 -12)">${paths}</g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function loadRotateAnchorImage(
  strokeColor: string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('Failed to load transformer rotate anchor icon'));
    image.src = createRotateAnchorSvgDataUrl(strokeColor);
  });
}

export function styleTransformerRotateAnchor(
  anchor: Konva.Rect,
  icon: HTMLImageElement | null
): void {
  if (!anchor.hasName(ROTATER_ANCHOR)) {
    return;
  }

  const size = TRANSFORMER_ROTATE_ANCHOR_SIZE;
  anchor.width(size);
  anchor.height(size);
  anchor.offsetX(size / 2);
  anchor.offsetY(size / 2);
  anchor.cornerRadius(size / 2);

  if (!(icon && icon.complete && icon.naturalWidth > 0)) {
    anchor.fillPriority('color');
    anchor.fillPatternImage(null);
    anchor.fill('#ffffff');
    anchor.strokeEnabled(true);
    return;
  }

  anchor.strokeEnabled(false);
  anchor.fillPriority('pattern');
  anchor.fillPatternImage(icon);
  anchor.fillPatternRepeat('no-repeat');
  anchor.fillPatternScale({
    x: size / icon.naturalWidth,
    y: size / icon.naturalHeight,
  });
  anchor.fillPatternOffset({ x: 0, y: 0 });
}
