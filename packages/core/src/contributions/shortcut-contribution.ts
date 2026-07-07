import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';

export abstract class ShortcutContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.Shortcut;

  abstract readonly keybinding: string;
  abstract readonly commandId: string;
  when?: string;
}
