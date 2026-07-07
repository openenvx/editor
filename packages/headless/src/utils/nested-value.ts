export function setNestedValue(
  data: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = data;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    const next = current[part];
    if (typeof next !== 'object' || next === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts.at(-1)!] = value;
}
