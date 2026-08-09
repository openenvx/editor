import { createDefaultTransform, type Layer } from '@openenvx/core/schema';

import type { CreateLayerChange } from '../schemas/proposed-changes';

const LAYER_TYPE_ALIASES: Record<string, string> = {
  text: 'canvas.text',
  rect: 'canvas.rect',
  rectangle: 'canvas.rect',
  image: 'canvas.image',
  svg: 'canvas.svg',
  group: 'canvas.group',
  circle: 'canvas.circle',
};

export function normalizeLayerType(type: string): string {
  const trimmed = type.trim();
  if (trimmed.startsWith('canvas.')) {
    return trimmed;
  }
  return LAYER_TYPE_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

function normalizeTextData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...data };
  if (typeof next.textAlign === 'string' && next.align === undefined) {
    next.align = next.textAlign;
  }
  delete next.textAlign;
  delete next.fontStyle;
  delete next.textTransform;

  if (typeof next.html === 'string') {
    const html = next.html.trim();
    if (html.length > 0 && !html.includes('<')) {
      next.html = `<p>${html}</p>`;
    }
  } else if (typeof next.text === 'string') {
    next.html = `<p>${next.text}</p>`;
    delete next.text;
  }

  return next;
}

export function normalizeLayerData(
  type: string,
  data: unknown
): Record<string, unknown> {
  const record =
    typeof data === 'object' && data !== null
      ? { ...(data as Record<string, unknown>) }
      : {};

  if (type === 'canvas.text') {
    return normalizeTextData(record);
  }
  if (type === 'canvas.rect' && typeof record.fill !== 'string') {
    return { fill: '#cccccc', ...record };
  }
  if (type === 'canvas.svg' && typeof record.svg !== 'string') {
    return {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>',
      ...record,
    };
  }
  return record;
}

function createLayerId(type: string): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
  const stem = type.includes('.') ? type.split('.').at(-1)! : type;
  return `${stem}-${suffix}`;
}

/** Normalize createLayer proposals at accept time (idempotent). */
export function normalizeCreateLayerChange(
  change: CreateLayerChange
): CreateLayerChange {
  const type = normalizeLayerType(change.type);
  return {
    ...change,
    type,
    data: normalizeLayerData(type, change.data),
  };
}

export function buildLayerFromChange(change: CreateLayerChange): Layer {
  const normalized = normalizeCreateLayerChange(change);
  const baseTransform = createDefaultTransform();
  const transform =
    normalized.transform && typeof normalized.transform === 'object'
      ? { ...baseTransform, ...normalized.transform }
      : baseTransform;

  return {
    id: normalized.id ?? createLayerId(normalized.type),
    type: normalized.type,
    data: (normalized.data as Record<string, unknown>) ?? {},
    transform,
  };
}
