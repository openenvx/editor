import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';
import type { TreeDataProvider } from './view-contribution';

export abstract class ViewTreeProviderContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.ViewTreeProvider;

  abstract readonly viewId: string;
  /** Spring @Primary — wins over non-primary providers for the same view id. */
  primary?: boolean;
  /** Spring @Order — lower wins among competing providers. Not ViewContribution.viewOrder. */
  order?: number;

  abstract createProvider(): TreeDataProvider<unknown>;
}
