import { describe, expect, it } from 'vitest';

import { AbsolutePageRules } from './absolute-page-rules';
import { getDefaultPageDimensions } from './page-presets';

describe('AbsolutePageRules', () => {
  const rules = new AbsolutePageRules();

  it('fills default dimensions and infers preset id', () => {
    const defaults = getDefaultPageDimensions();
    const normalized = rules.normalizePage({
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
    });
    expect(normalized.width).toBe(defaults.width);
    expect(normalized.height).toBe(defaults.height);
    expect(normalized.presetId).toBe('a4-portrait');
  });

  it('rejects absolute pages missing width/height after normalize failure path', () => {
    const errors = rules.validatePage({
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('width and height');
  });
});
