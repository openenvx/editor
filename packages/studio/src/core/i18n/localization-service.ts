import { Emitter } from '../runtime/emitter';
import type { Disposable, Event } from '../runtime/emitter';

export interface LocalizationBundleOptions {
  override?: boolean;
}

export interface LocalizeOptions {
  defaultValue?: string;
  params?: Record<string, string | number>;
}

export interface LocalizationService extends Disposable {
  readonly locale: string;
  readonly fallbackLocale: string;
  t(key: string, options?: LocalizeOptions): string;
  registerBundle(
    sourceId: string,
    locale: string,
    messages: Record<string, string>,
    options?: LocalizationBundleOptions
  ): void;
  getBundlesForLocale(locale: string): Record<string, string>;
  setLocale(locale: string): void;
  setFallbackLocale(locale: string): void;
  readonly onDidChangeLocale: Event<string>;
}

function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replaceAll(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined ? `{{${name}}}` : String(value);
  });
}

export class LocalizationServiceImpl implements LocalizationService {
  private readonly bundles = new Map<string, Map<string, string>>();
  private readonly localeEmitter = new Emitter<string>();
  private _locale = 'en';
  private _fallbackLocale = 'en';

  readonly onDidChangeLocale = this.localeEmitter.event;

  get locale(): string {
    return this._locale;
  }

  get fallbackLocale(): string {
    return this._fallbackLocale;
  }

  t(key: string, options?: LocalizeOptions): string {
    const resolved =
      this.lookup(key, this._locale) ??
      this.lookup(key, this._fallbackLocale) ??
      options?.defaultValue ??
      key;

    if (!options?.params || Object.keys(options.params).length === 0) {
      return resolved;
    }

    return interpolate(resolved, options.params);
  }

  registerBundle(
    _sourceId: string,
    locale: string,
    messages: Record<string, string>,
    options?: LocalizationBundleOptions
  ): void {
    let localeBundle = this.bundles.get(locale);
    if (!localeBundle) {
      localeBundle = new Map();
      this.bundles.set(locale, localeBundle);
    }

    for (const [key, value] of Object.entries(messages)) {
      if (options?.override === false && localeBundle.has(key)) {
        continue;
      }
      localeBundle.set(key, value);
    }
  }

  getBundlesForLocale(locale: string): Record<string, string> {
    const bundle = this.bundles.get(locale);
    if (!bundle) {
      return {};
    }
    return Object.fromEntries(bundle.entries());
  }

  setLocale(locale: string): void {
    if (locale === this._locale) {
      return;
    }
    this._locale = locale;
    this.localeEmitter.fire(locale);
  }

  setFallbackLocale(locale: string): void {
    this._fallbackLocale = locale;
  }

  dispose(): void {
    this.localeEmitter.dispose();
    this.bundles.clear();
  }

  private lookup(key: string, locale: string): string | undefined {
    return this.bundles.get(locale)?.get(key);
  }
}
