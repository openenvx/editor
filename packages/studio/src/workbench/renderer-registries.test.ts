import { Registry } from '../backbone';
import { describe, expect, it } from 'vitest';

describe('renderer registries', () => {
  it('overwrites duplicate field renderer kinds', () => {
    const registry = new Registry<string, unknown>('overwrite');
    const first = { render: 'first' };
    const second = { render: 'second' };
    registry.register('text', first);
    registry.register('text', second);
    expect(registry.get('text')).toBe(second);
  });

  it('overwrites duplicate status bar item renderer kinds', () => {
    const registry = new Registry<string, unknown>('overwrite');
    const first = { render: 'first' };
    const second = { render: 'second' };
    registry.register('dropdown', first);
    registry.register('dropdown', second);
    expect(registry.get('dropdown')).toBe(second);
  });

  it('overwrites duplicate editor pane kinds', () => {
    const registry = new Registry<string, unknown>('overwrite');
    const first = { render: 'first' };
    const second = { render: 'second' };
    registry.register('absolute', first);
    registry.register('absolute', second);
    expect(registry.get('absolute')).toBe(second);
  });
});
