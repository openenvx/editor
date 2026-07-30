import type { ContributionBuildContext } from '@openenvx/core';

import type { PropertyPaneDescriptor } from '../inspector/property-pane-descriptor';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class PropertyPaneContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.PropertyPane;

  abstract readonly id: string;
  abstract readonly title: string;

  abstract buildDescriptor(
    ctx: ContributionBuildContext
  ): PropertyPaneDescriptor;
}
