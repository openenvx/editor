import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { CommandContext } from '../runtime/types';

export abstract class ContextKeyContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.ContextKey;

  abstract readonly key: string;

  abstract evaluate(ctx: CommandContext): boolean | string | number;
}
