import { describe, expect, it } from 'vitest';

import { LocalizationServiceImpl } from '../i18n/localization-service';
import { ThemeServiceImpl } from '../workbench/theme-service';
import { WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID } from './workbench-menu-choice-ids';
import { WorkbenchThemeMenuChoiceProvider } from './workbench-theme-menu-choice-provider';

describe('WorkbenchThemeMenuChoiceProvider', () => {
  it('reads and writes the theme service', () => {
    const theme = new ThemeServiceImpl();
    const localization = new LocalizationServiceImpl();
    const provider = new WorkbenchThemeMenuChoiceProvider(theme, localization);

    expect(provider.id).toBe(WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID);
    expect(provider.getValue()).toBe('light');
    provider.setValue('dark');
    expect(theme.theme).toBe('dark');
    expect(provider.getChoices().map((choice) => choice.value)).toEqual([
      'light',
      'dark',
    ]);
  });
});
