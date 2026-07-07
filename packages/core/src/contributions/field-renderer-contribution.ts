import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';

export abstract class FieldRendererContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.FieldRenderer;

  abstract readonly kind: string;

  /** React component type stored as unknown - core stays React-free. */
  abstract readonly Component: unknown;
}
