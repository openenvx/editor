import { describe, expect, it } from 'vitest';

import { IconRegistryImpl } from './icon-registry-service';

describe('IconRegistryImpl', () => {
  it('registers and resolves glyphs by id', () => {
    const registry = new IconRegistryImpl();
    const glyph = { id: 'test-icon' };

    registry.register('test', glyph);

    expect(registry.resolve('test')).toBe(glyph);
    expect(registry.resolve('missing')).toBeNull();
  });

  it('registerDefaults merges a map of glyphs', () => {
    const registry = new IconRegistryImpl();
    const left = { id: 'left' };
    const right = { id: 'right' };

    registry.registerDefaults({ alignLeft: left, alignRight: right });

    expect(registry.resolve('alignLeft')).toBe(left);
    expect(registry.resolve('alignRight')).toBe(right);
  });
});
