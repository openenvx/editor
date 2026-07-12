import type { ContributionBuildContext } from '@openenvx/core';

import type { InspectorPaneDescriptor } from '../inspector/inspector-pane-descriptor';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class InspectorPaneContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.InspectorPane;

  abstract readonly id: string;
  abstract readonly title: string;

  abstract buildDescriptor(
    ctx: ContributionBuildContext
  ): InspectorPaneDescriptor;
}
