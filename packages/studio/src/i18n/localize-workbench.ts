import {
  localize,
  type LocalizeOptions,
  type ServiceContainer,
} from '@openenvx/studio/core';

import { WORKBENCH_I18N_KEY_PREFIX } from './workbench-i18n';

/** Resolve a workbench locale key via {@link LocalizationService} (`workbench.*` bundle). */
export function localizeWorkbench(
  services: ServiceContainer,
  key: string,
  options?: LocalizeOptions
): string {
  return localize(services, `${WORKBENCH_I18N_KEY_PREFIX}${key}`, options);
}
