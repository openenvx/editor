import type { LocalizationService } from '../i18n/localization-service';
import type { ThemeService } from '../workbench/theme-service';
import type { MenuChoice, MenuChoiceProvider } from './menu-choice';
import { WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID } from './workbench-menu-choice-ids';

export class WorkbenchThemeMenuChoiceProvider implements MenuChoiceProvider {
  readonly id = WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID;

  constructor(
    private readonly theme: ThemeService,
    private readonly localization: LocalizationService
  ) {}

  get onDidChangeValue() {
    return this.theme.onDidChangeTheme;
  }

  getValue(): string {
    return this.theme.theme;
  }

  setValue(value: string): void {
    this.theme.setTheme(value);
  }

  getChoices(): MenuChoice[] {
    return [
      {
        label: this.localization.t('theme.light', { defaultValue: 'Light' }),
        value: 'light',
      },
      {
        label: this.localization.t('theme.dark', { defaultValue: 'Dark' }),
        value: 'dark',
      },
    ];
  }
}
