import { describe, expect, it } from 'vitest';

import { Registry } from './registry';

describe('Registry', () => {
  it('registers and retrieves values by key', () => {
    const registry = new Registry<string, string>();
    registry.register('a', 'first');
    expect(registry.get('a')).toBe('first');
    expect(registry.has('a')).toBe(true);
    expect(registry.keys()).toStrictEqual(['a']);
    expect(registry.getAll()).toStrictEqual(['first']);
    expect(registry.entries()).toStrictEqual([['a', 'first']]);
  });

  it('overwrites duplicate keys by default', () => {
    const registry = new Registry<string, string>();
    registry.register('a', 'first');
    registry.register('a', 'second');
    expect(registry.get('a')).toBe('second');
  });

  it('throws on duplicate keys when policy is throw', () => {
    const registry = new Registry<string, string>('throw');
    registry.register('a', 'first');
    expect(() => registry.register('a', 'second')).toThrow(
      'Duplicate registry entry: a'
    );
  });

  it('ignores duplicate keys when policy is ignore', () => {
    const registry = new Registry<string, string>('ignore');
    registry.register('a', 'first');
    registry.register('a', 'second');
    expect(registry.get('a')).toBe('first');
  });
});
