import { Contribution } from '../runtime/contribution';
import { ContributionPoint } from '../runtime/contribution-point';

export abstract class ShortcutContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.Shortcut;

  abstract readonly keybinding: string;
  abstract readonly commandId: string;
  when?: string;
}
