import { Contribution } from '../runtime/contribution';
import { ContributionPoint } from '../runtime/contribution-point';
import type { I18nBundleRegistry } from './i18n-bundle-registry';

export abstract class I18nContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.I18n;

  abstract readonly sourceId: string;

  abstract contribute(registry: I18nBundleRegistry): void;
}
