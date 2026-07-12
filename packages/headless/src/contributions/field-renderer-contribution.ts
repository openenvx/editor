import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class FieldRendererContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.FieldRenderer;

  abstract readonly kind: string;

  /** React component type stored as unknown - core stays React-free. */
  abstract readonly Component: unknown;
}
