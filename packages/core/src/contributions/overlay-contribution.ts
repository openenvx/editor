import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';

export interface OverlayDescriptor {
  id: string;
  title: string;
  content: OverlayContentDescriptor;
  visible: boolean;
}

type OverlayContentDescriptor =
  | { kind: 'text'; text: string }
  | { kind: 'command-list'; commandIds: string[] };

export abstract class OverlayContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.Overlay;

  abstract readonly id: string;

  abstract getOverlay(): OverlayDescriptor;
}
