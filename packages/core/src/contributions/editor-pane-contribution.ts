import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';

export abstract class EditorPaneContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.EditorPane;

  abstract readonly editorPaneKind: string;

  /** React component type stored as unknown - core stays React-free. */
  abstract readonly Component: unknown;
}
