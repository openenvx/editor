import { createServiceId } from '../runtime/create-service-id';
import type { Disposable } from '../runtime/emitter';
import type { MenuChoiceProvider } from './menu-choice';

export const MenuChoiceRegistryId =
  createServiceId<MenuChoiceRegistry>('MenuChoiceRegistry');

export interface MenuChoiceRegistry {
  register(provider: MenuChoiceProvider): Disposable;
  getProvider(id: string): MenuChoiceProvider | undefined;
}

export class MenuChoiceRegistryImpl implements MenuChoiceRegistry {
  private readonly providers = new Map<string, MenuChoiceProvider>();

  register(provider: MenuChoiceProvider): Disposable {
    if (this.providers.has(provider.id)) {
      throw new Error(
        `Menu choice provider already registered: ${provider.id}`
      );
    }
    this.providers.set(provider.id, provider);
    return {
      dispose: () => {
        this.providers.delete(provider.id);
      },
    };
  }

  getProvider(id: string): MenuChoiceProvider | undefined {
    return this.providers.get(id);
  }
}
