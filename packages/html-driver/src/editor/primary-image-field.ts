import type { FieldDef } from '../block-config';

const PREFERRED_IMAGE_KEYS = ['src', 'backgroundImage'] as const;

/** Primary replaceable image field: src → backgroundImage → first image field. */
export function primaryImageFieldKey(
  fields: Record<string, FieldDef> | undefined
): string | null {
  if (!fields) {
    return null;
  }
  for (const key of PREFERRED_IMAGE_KEYS) {
    if (fields[key]?.kind === 'image') {
      return key;
    }
  }
  for (const [key, field] of Object.entries(fields)) {
    if (field.kind === 'image') {
      return key;
    }
  }
  return null;
}

/** Nested path for an html.image slot part's src on the host layer. */
export function slotImageDataPath(slotKey: string, index: number): string {
  return `slots.${slotKey}.${index}.data.src`;
}

function imageFieldKeys(
  fields: Record<string, FieldDef> | undefined
): readonly string[] {
  if (!fields) {
    return PREFERRED_IMAGE_KEYS;
  }
  return Object.entries(fields)
    .filter(([, field]) => field.kind === 'image')
    .map(([key]) => key);
}

/** Clone data with image URL fields passed through `resolveAssetUrl`. */
export function resolveImageFieldsInData(
  data: Record<string, unknown>,
  resolveAssetUrl: (ref: string) => string,
  fields?: Record<string, FieldDef>
): Record<string, unknown> {
  let next: Record<string, unknown> | null = null;
  for (const key of imageFieldKeys(fields)) {
    const value = data[key];
    if (typeof value !== 'string' || value.length === 0) {
      continue;
    }
    const resolved = resolveAssetUrl(value);
    if (resolved === value) {
      continue;
    }
    next ??= { ...data };
    next[key] = resolved;
  }
  return next ?? data;
}
