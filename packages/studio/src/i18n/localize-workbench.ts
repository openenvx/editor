import type { ServiceContainer } from '../runtime/instantiation-service';
import type { LocalizeOptions } from './localization-service';
import { localize } from './localize';
import { WORKBENCH_I18N_KEY_PREFIX } from './workbench-i18n';

/** Resolve a workbench locale key via {@link LocalizationService} (`workbench.*` bundle). */
export function localizeWorkbench(
  services: ServiceContainer,
  key: string,
  options?: LocalizeOptions
): string {
  return localize(services, `${WORKBENCH_I18N_KEY_PREFIX}${key}`, options);
}
