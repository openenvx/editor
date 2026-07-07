import type {
  LocalizationBundleOptions,
  LocalizationService,
} from './localization-service';

export class I18nBundleRegistry {
  constructor(
    private readonly sourceId: string,
    private readonly localization: LocalizationService
  ) {}

  bundle(
    locale: string,
    messages: Record<string, string>,
    options?: LocalizationBundleOptions
  ): void {
    this.localization.registerBundle(this.sourceId, locale, messages, options);
  }
}
