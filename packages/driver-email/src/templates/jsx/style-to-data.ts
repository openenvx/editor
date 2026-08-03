import type { CSSProperties } from 'react';

/** Parse `12`, `'12'`, or `'12px'` → number. */
export function stylePx(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  const pxMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (pxMatch) {
    return Number(pxMatch[1]);
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function splitPadding(value: unknown): {
  paddingX?: number;
  paddingY?: number;
} {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { paddingX: value, paddingY: value };
  }
  if (typeof value !== 'string') {
    return {};
  }
  const parts = value
    .trim()
    .split(/\s+/)
    .map((part) => stylePx(part))
    .filter((n): n is number => n !== undefined);
  if (parts.length === 1) {
    return { paddingX: parts[0], paddingY: parts[0] };
  }
  if (parts.length === 2) {
    return { paddingY: parts[0], paddingX: parts[1] };
  }
  if (parts.length === 3) {
    // top | x | bottom — model is symmetric paddingY; prefer top when unequal
    const paddingY = parts[0] === parts[2] ? parts[0] : parts[0];
    return { paddingY, paddingX: parts[1] };
  }
  if (parts.length >= 4) {
    const paddingY = parts[0] === parts[2] ? parts[0] : parts[0];
    const paddingX = parts[1] === parts[3] ? parts[1] : parts[1];
    return { paddingX, paddingY };
  }
  return {};
}

/**
 * Map React `style={{ ... }}` onto email block `data` fields the inspector already knows.
 */
export function styleToBlockData(
  style: CSSProperties | undefined
): Record<string, unknown> {
  if (!style) {
    return {};
  }

  const data: Record<string, unknown> = {};

  const background = style.backgroundColor ?? style.background;
  if (typeof background === 'string' && background.length > 0) {
    data.background = background;
  }

  if (typeof style.color === 'string') {
    data.color = style.color;
  }

  const fontSize = stylePx(style.fontSize);
  if (fontSize !== undefined) {
    data.fontSize = fontSize;
  }

  if (style.lineHeight !== undefined && style.lineHeight !== null) {
    data.lineHeight =
      typeof style.lineHeight === 'number'
        ? String(style.lineHeight)
        : String(style.lineHeight);
  }

  const marginTop = stylePx(style.marginTop);
  if (marginTop !== undefined) {
    data.marginTop = marginTop;
  }
  const marginBottom = stylePx(style.marginBottom);
  if (marginBottom !== undefined) {
    data.marginBottom = marginBottom;
  }

  const fromPadding = splitPadding(style.padding);
  let paddingX = fromPadding.paddingX;
  let paddingY = fromPadding.paddingY;

  const paddingLeft = stylePx(style.paddingLeft);
  const paddingRight = stylePx(style.paddingRight);
  if (paddingLeft !== undefined || paddingRight !== undefined) {
    paddingX = paddingLeft ?? paddingRight;
    if (
      paddingLeft !== undefined &&
      paddingRight !== undefined &&
      paddingLeft !== paddingRight
    ) {
      // ponytail: column model is symmetric paddingX — keep left when unequal
      paddingX = paddingLeft;
    }
  }

  const paddingTop = stylePx(style.paddingTop);
  const paddingBottom = stylePx(style.paddingBottom);
  if (paddingTop !== undefined || paddingBottom !== undefined) {
    paddingY = paddingTop ?? paddingBottom;
    if (
      paddingTop !== undefined &&
      paddingBottom !== undefined &&
      paddingTop !== paddingBottom
    ) {
      // ponytail: section model is symmetric paddingY — keep top when unequal
      paddingY = paddingTop;
    }
  }

  if (paddingX !== undefined) {
    data.paddingX = paddingX;
  }
  if (paddingY !== undefined) {
    data.paddingY = paddingY;
  }

  const borderRadius = stylePx(style.borderRadius);
  if (borderRadius !== undefined) {
    data.borderRadius = borderRadius;
  }

  const maxWidth = stylePx(style.maxWidth);
  if (maxWidth !== undefined) {
    data.maxWidth = maxWidth;
  }

  if (typeof style.textAlign === 'string') {
    data.align = style.textAlign;
  }

  if (typeof style.verticalAlign === 'string') {
    data.verticalAlign = style.verticalAlign;
  }

  const width = style.width;
  if (typeof width === 'number' && Number.isFinite(width)) {
    data.width = `${width}px`;
  } else if (typeof width === 'string' && width.length > 0) {
    data.width = width;
  }

  // margin auto centering → align center (images)
  if (
    (style.marginLeft === 'auto' && style.marginRight === 'auto') ||
    style.marginInline === 'auto'
  ) {
    data.align = 'center';
  }

  return data;
}
