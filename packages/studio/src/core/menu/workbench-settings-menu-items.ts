import type { RadioGroupMenuItemDescriptor } from '../builders/menu-builder';
import { WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID } from './workbench-menu-choice-ids';

export const WORKBENCH_THEME_SETTINGS_MENU_ITEM: RadioGroupMenuItemDescriptor =
  {
    id: 'workbench-settings-theme',
    kind: 'radioGroup',
    label: 'Theme',
    providerId: WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID,
  };
