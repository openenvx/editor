import { LocalizationServiceId } from '@openenvx/core';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import { useWorkbenchContext } from '../context/workbench-context';
import { syncWorkbenchI18nFromService, workbenchI18n } from './workbench-i18n';

export interface WorkbenchI18nProviderProps {
  locale?: string;
  fallbackLocale?: string;
  children: ReactNode;
}

export function WorkbenchI18nProvider({
  locale = 'en',
  fallbackLocale = 'en',
  children,
}: WorkbenchI18nProviderProps) {
  const { api } = useWorkbenchContext();

  useEffect(() => {
    const service = api.getService(LocalizationServiceId);
    if (!service) {
      return;
    }

    service.setFallbackLocale(fallbackLocale);
    service.setLocale(locale);
    syncWorkbenchI18nFromService(service);

    return service.onDidChangeLocale(() => {
      syncWorkbenchI18nFromService(service);
    }).dispose;
  }, [api, fallbackLocale, locale]);

  return <I18nextProvider i18n={workbenchI18n}>{children}</I18nextProvider>;
}
