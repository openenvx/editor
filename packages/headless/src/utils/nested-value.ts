function isNumericPathSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export function getNestedValue(
  data: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setNestedValue(
  data: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split('.');
  let current: unknown = data;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    const nextPart = parts[i + 1]!;
    if (typeof current !== 'object' || current === null) {
      return;
    }
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) {
        return;
      }
      let next = current[index];
      if (typeof next !== 'object' || next === null) {
        next = isNumericPathSegment(nextPart) ? [] : {};
        current[index] = next;
      }
      current = next;
      continue;
    }
    const record = current as Record<string, unknown>;
    let next = record[part];
    if (typeof next !== 'object' || next === null) {
      next = isNumericPathSegment(nextPart) ? [] : {};
      record[part] = next;
    }
    current = next;
  }
  const leaf = parts.at(-1)!;
  if (Array.isArray(current)) {
    const index = Number(leaf);
    if (!Number.isInteger(index)) {
      return;
    }
    current[index] = value;
    return;
  }
  if (typeof current === 'object' && current !== null) {
    (current as Record<string, unknown>)[leaf] = value;
  }
}
