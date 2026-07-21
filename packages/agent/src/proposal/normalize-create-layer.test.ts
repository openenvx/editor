import { describe, expect, it } from 'vitest';

import {
  normalizeCreateLayerChange,
  normalizeLayerType,
} from './normalize-create-layer';

describe('normalizeLayerType', () => {
  it('aliases svg to canvas.svg', () => {
    expect(normalizeLayerType('svg')).toBe('canvas.svg');
    expect(normalizeLayerType('canvas.svg')).toBe('canvas.svg');
  });
});

describe('normalizeCreateLayerChange', () => {
  it('defaults missing svg markup', () => {
    const normalized = normalizeCreateLayerChange({
      kind: 'createLayer',
      type: 'svg',
      data: { fill: '#000' },
    });
    expect(normalized.type).toBe('canvas.svg');
    expect(typeof (normalized.data as { svg?: string }).svg).toBe('string');
  });
});
