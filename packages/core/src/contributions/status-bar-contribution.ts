import type { StatusBarBuilder } from '../builders/status-bar-builder';
import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { CommandContext } from '../runtime/types';

export abstract class StatusBarContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.StatusBar;

  abstract contribute(builder: StatusBarBuilder, ctx: CommandContext): void;
}

export type {
  StatusBarDropdownItemDescriptor,
  StatusBarItemDescriptor,
  StatusBarTextItemDescriptor,
} from '../builders/status-bar-builder';
