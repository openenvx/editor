import type { ServiceContainer } from '../runtime/instantiation-service';
import type { LocalizeOptions } from './localization-service';
import { LocalizationServiceId } from './localization-service-id';

export function localize(
  services: ServiceContainer,
  key: string,
  options?: LocalizeOptions
): string {
  if (!services.has(LocalizationServiceId)) {
    return options?.defaultValue ?? key;
  }
  return services.get(LocalizationServiceId).t(key, options);
}

export interface ContributionBuildContext {
  t: (key: string, defaultValue?: string) => string;
  canExecute: (commandId: string) => boolean;
}

export function createContributionBuildContext(
  services: ServiceContainer,
  canExecute: (commandId: string) => boolean
): ContributionBuildContext {
  return {
    canExecute,
    t: (key: string, defaultValue?: string) =>
      localize(services, key, { defaultValue }),
  };
}
