import type { LocalizationService } from '@openenvx/studio/core';
import { createInstance } from 'i18next';
import type { i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import workbenchEn from './locales/en/workbench-en';
import workbenchPl from './locales/pl/workbench-pl';

export const WORKBENCH_I18N_NAMESPACE = 'workbench';

export const WORKBENCH_I18N_KEY_PREFIX = 'workbench.';

export const WORKBENCH_I18N_SOURCE_ID = 'openenvx.workbench';

function toWorkbenchNamespaceMessages(
  bundle: Record<string, string>
): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const [key, value] of Object.entries(bundle)) {
    if (key.startsWith(WORKBENCH_I18N_KEY_PREFIX)) {
      messages[key.slice(WORKBENCH_I18N_KEY_PREFIX.length)] = value;
    }
  }
  return messages;
}

export const workbenchI18n: i18n = createInstance();

workbenchI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: WORKBENCH_I18N_NAMESPACE,
  ns: [WORKBENCH_I18N_NAMESPACE],
  interpolation: { escapeValue: false },
  resources: {
    en: {
      [WORKBENCH_I18N_NAMESPACE]: workbenchEn,
    },
    pl: {
      [WORKBENCH_I18N_NAMESPACE]: workbenchPl,
    },
  },
});

export function syncWorkbenchI18nFromService(
  service: LocalizationService
): void {
  for (const locale of [service.locale, service.fallbackLocale]) {
    const messages = toWorkbenchNamespaceMessages(
      service.getBundlesForLocale(locale)
    );
    if (Object.keys(messages).length > 0) {
      workbenchI18n.addResourceBundle(
        locale,
        WORKBENCH_I18N_NAMESPACE,
        messages,
        true,
        true
      );
    }
  }

  if (workbenchI18n.language !== service.locale) {
    void workbenchI18n.changeLanguage(service.locale);
  }
}

export function registerDefaultWorkbenchBundle(
  messages: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [
      `${WORKBENCH_I18N_KEY_PREFIX}${key}`,
      value,
    ])
  );
}

/** Register default workbench UI strings on the headless localization service. */
export function registerWorkbenchLocalizationBundles(
  service: LocalizationService
): void {
  service.registerBundle(
    WORKBENCH_I18N_SOURCE_ID,
    'en',
    registerDefaultWorkbenchBundle(workbenchEn)
  );
  service.registerBundle(
    WORKBENCH_I18N_SOURCE_ID,
    'pl',
    registerDefaultWorkbenchBundle(workbenchPl)
  );
}
