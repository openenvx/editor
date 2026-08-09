import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export interface OverlayDescriptor {
  id: string;
  title: string;
  content: OverlayContentDescriptor;
  visible: boolean;
}

type OverlayContentDescriptor =
  | { kind: 'text'; text: string }
  | { kind: 'command-list'; commandIds: string[] };

export abstract class OverlayContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.Overlay;

  abstract readonly id: string;

  abstract getOverlay(): OverlayDescriptor;
}
