import { describe, expect, it } from 'vitest';

import { getNestedValue, setNestedValue } from './nested-value';

describe('nested-value', () => {
  it('reads and writes dotted paths on records', () => {
    const data: Record<string, unknown> = { a: { b: 1 } };
    expect(getNestedValue(data, 'a.b')).toBe(1);
    setNestedValue(data, 'a.b', 2);
    expect(getNestedValue(data, 'a.b')).toBe(2);
  });

  it('creates arrays when the next segment is numeric', () => {
    const data: Record<string, unknown> = { slots: {} };
    setNestedValue(data, 'slots.actions.0.data.label', 'CTA');
    const actions = (data.slots as Record<string, unknown>).actions;
    expect(Array.isArray(actions)).toBe(true);
    expect(getNestedValue(data, 'slots.actions.0.data.label')).toBe('CTA');
  });
});
