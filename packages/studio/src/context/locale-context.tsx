import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { DEFAULT_LOCALE } from '../i18n/locale-definitions';
import type { LocaleContextValue } from '../i18n/locale-definitions';

export type {
  LocaleContextValue,
  SupportedLocale,
} from '../i18n/locale-definitions';
export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../i18n/locale-definitions';

const noop = () => {};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: noop,
});

export interface LocaleProviderProps {
  locale: string;
  onLocaleChange?: (locale: string) => void;
  children: ReactNode;
}

export function LocaleProvider({
  locale,
  onLocaleChange,
  children,
}: LocaleProviderProps) {
  const value = useMemo(
    (): LocaleContextValue => ({
      locale,
      setLocale: onLocaleChange ?? noop,
    }),
    [locale, onLocaleChange]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): string {
  return useContext(LocaleContext).locale;
}

export function useSetLocale(): (locale: string) => void {
  return useContext(LocaleContext).setLocale;
}
