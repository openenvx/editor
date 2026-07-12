import type { WorkbenchContributionPoint } from './workbench-contribution-point';

export abstract class WorkbenchContribution {
  abstract readonly contributionPoint: WorkbenchContributionPoint;
}
