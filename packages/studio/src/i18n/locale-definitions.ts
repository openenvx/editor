export const SUPPORTED_LOCALES = ['en', 'pl'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export interface LocaleContextValue {
  locale: string;
  setLocale: (locale: string) => void;
}
