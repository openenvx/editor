import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class StatusBarItemRendererContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.StatusBarItemRenderer;

  abstract readonly kind: string;

  /** React component type stored as unknown - core stays React-free. */
  abstract readonly Component: unknown;
}
