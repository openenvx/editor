export function readNestedValue(objectValue: unknown, key: string): unknown {
  if (typeof objectValue !== 'object' || objectValue === null) {
    return undefined;
  }
  return (objectValue as Record<string, unknown>)[key];
}

export function writeNestedValue(
  objectValue: unknown,
  key: string,
  nextValue: unknown
): Record<string, unknown> {
  const base =
    typeof objectValue === 'object' && objectValue !== null
      ? { ...(objectValue as Record<string, unknown>) }
      : {};
  base[key] = nextValue;
  return base;
}
