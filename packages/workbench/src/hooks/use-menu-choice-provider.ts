import { LocalizationServiceId, MenuChoiceRegistryId } from '@openenvx/core';
import type { MenuChoiceProvider } from '@openenvx/core';
import { useEffect, useReducer } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';

export function useMenuChoiceProvider(
  providerId: string
): MenuChoiceProvider | undefined {
  const { api } = useWorkbenchContext();
  const registry = api.getService(MenuChoiceRegistryId);
  const provider = registry?.getProvider(providerId);
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    if (!provider) {
      return;
    }

    const disposables: { dispose: () => void }[] = [];

    if (provider.onDidChangeValue) {
      disposables.push(provider.onDidChangeValue(() => rerender()));
    }

    const localization = api.getService(LocalizationServiceId);
    if (localization) {
      disposables.push(localization.onDidChangeLocale(() => rerender()));
    }

    return () => {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    };
  }, [api, provider]);

  return provider;
}
