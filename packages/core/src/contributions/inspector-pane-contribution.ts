import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { ContributionBuildContext } from '../i18n/localize';
import type { InspectorPaneDescriptor } from '../inspector/inspector-pane-descriptor';

export abstract class InspectorPaneContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.InspectorPane;

  abstract readonly id: string;
  abstract readonly title: string;

  abstract buildDescriptor(
    ctx: ContributionBuildContext
  ): InspectorPaneDescriptor;
}
