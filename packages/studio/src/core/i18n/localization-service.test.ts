import { describe, expect, it } from 'vitest';

import { LocalizationServiceImpl } from './localization-service';

describe('LocalizationServiceImpl', () => {
  it('returns registered message for active locale', () => {
    const service = new LocalizationServiceImpl();
    service.registerBundle('test', 'en', { 'workbench.file.save': 'Save' });
    expect(service.t('workbench.file.save')).toBe('Save');
  });

  it('falls back to fallback locale', () => {
    const service = new LocalizationServiceImpl();
    service.registerBundle('test', 'en', { 'workbench.file.save': 'Save' });
    service.setLocale('sv');
    expect(service.t('workbench.file.save')).toBe('Save');
  });

  it('later bundles override earlier keys by default', () => {
    const service = new LocalizationServiceImpl();
    service.registerBundle('a', 'sv', { 'workbench.file.save': 'Spara A' });
    service.registerBundle('b', 'sv', { 'workbench.file.save': 'Spara B' });
    service.setLocale('sv');
    expect(service.t('workbench.file.save')).toBe('Spara B');
  });

  it('uses defaultValue when key is missing', () => {
    const service = new LocalizationServiceImpl();
    expect(service.t('missing.key', { defaultValue: 'Fallback' })).toBe(
      'Fallback'
    );
  });

  it('interpolates params', () => {
    const service = new LocalizationServiceImpl();
    service.registerBundle('test', 'en', {
      'workbench.stepper.decrease': 'Decrease {{label}}',
    });
    expect(
      service.t('workbench.stepper.decrease', {
        params: { label: 'Width' },
      })
    ).toBe('Decrease Width');
  });

  it('fires onDidChangeLocale when locale changes', () => {
    const service = new LocalizationServiceImpl();
    const locales: string[] = [];
    service.onDidChangeLocale((locale) => {
      locales.push(locale);
    });
    service.setLocale('sv');
    expect(locales).toEqual(['sv']);
  });

  it('does not fire onDidChangeLocale when locale is unchanged', () => {
    const service = new LocalizationServiceImpl();
    const locales: string[] = [];
    service.onDidChangeLocale((locale) => {
      locales.push(locale);
    });
    service.setLocale('en');
    expect(locales).toEqual([]);
  });
});
