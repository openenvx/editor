import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class EditorPaneContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.EditorPane;

  abstract readonly editorPaneKind: string;

  /** React component type stored as unknown - core stays React-free. */
  abstract readonly Component: unknown;
}
