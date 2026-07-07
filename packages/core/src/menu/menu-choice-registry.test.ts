import { describe, expect, it, vi } from 'vitest';

import { MenuChoiceRegistryImpl } from './menu-choice-registry';
import type { MenuChoiceProvider } from './menu-choice';

function createProvider(
  id: string,
  overrides: Partial<MenuChoiceProvider> = {}
): MenuChoiceProvider {
  return {
    id,
    getValue: () => 'a',
    setValue: vi.fn(),
    getChoices: () => [{ value: 'a', label: 'A' }],
    ...overrides,
  };
}

describe('MenuChoiceRegistryImpl', () => {
  it('registers and resolves providers by id', () => {
    const registry = new MenuChoiceRegistryImpl();
    const provider = createProvider('test.provider');

    registry.register(provider);

    expect(registry.getProvider('test.provider')).toBe(provider);
    expect(registry.getProvider('missing')).toBeUndefined();
  });

  it('unregisters providers on dispose', () => {
    const registry = new MenuChoiceRegistryImpl();
    const provider = createProvider('test.provider');

    const disposable = registry.register(provider);
    disposable.dispose();

    expect(registry.getProvider('test.provider')).toBeUndefined();
  });

  it('rejects duplicate provider ids', () => {
    const registry = new MenuChoiceRegistryImpl();
    registry.register(createProvider('test.provider'));

    expect(() => registry.register(createProvider('test.provider'))).toThrow(
      /already registered/
    );
  });
});
