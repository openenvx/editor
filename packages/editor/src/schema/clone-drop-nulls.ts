/** Keys whose values are opaque plugin data - cloned verbatim, never walked. */
const OPAQUE_KEYS = new Set(['custom']);

/**
 * Deep-copy `value`, dropping null/undefined-valued keys so they read as
 * "missing" and fill schema defaults instead of failing type checks.
 */
export function cloneDropNulls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== null && v !== undefined)
      .map(cloneDropNulls);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const v = (value as Record<string, unknown>)[key];
      if (v === null || v === undefined) {
        continue;
      }
      out[key] = OPAQUE_KEYS.has(key) ? structuredClone(v) : cloneDropNulls(v);
    }
    return out;
  }
  return value;
}
