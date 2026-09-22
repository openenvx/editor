import type { I18nBundleRegistry } from '../i18n/i18n-bundle-registry';
import { I18nContribution } from '../i18n/i18n-contribution';
import coreEn from '../i18n/locales/en/core-en';
import corePl from '../i18n/locales/pl/core-pl';
import { Plugin } from '../runtime/plugin';
import type { PluginContext } from '../runtime/plugin-manager';

class CoreI18nBundle extends I18nContribution {
  readonly sourceId = 'core';

  contribute(registry: I18nBundleRegistry): void {
    registry.bundle('en', { ...coreEn });
    registry.bundle('pl', { ...corePl });
  }
}

export class CoreI18nPlugin extends Plugin {
  readonly id = 'core.i18n';

  activate(ctx: PluginContext): void {
    ctx.register(new CoreI18nBundle());
  }
}
