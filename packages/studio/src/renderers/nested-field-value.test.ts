import { describe, expect, it } from 'vitest';

import { readNestedValue, writeNestedValue } from './nested-field-value';

describe('nested field value helpers', () => {
  it('reads nested keys from objects', () => {
    expect(readNestedValue({ top: 4, left: 8 }, 'top')).toBe(4);
  });

  it('writes nested keys into objects', () => {
    expect(writeNestedValue({ top: 4 }, 'left', 8)).toEqual({
      top: 4,
      left: 8,
    });
  });

  it('creates object when writing into undefined', () => {
    expect(writeNestedValue(undefined, 'blur', 12)).toEqual({ blur: 12 });
  });
});
