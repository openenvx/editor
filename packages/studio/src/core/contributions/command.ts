import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { CommandContext } from '../runtime/types';

export abstract class Command extends Contribution {
  readonly contributionPoint = ContributionPoint.Command;

  abstract readonly id: string;

  abstract execute(
    ctx: CommandContext,
    args?: unknown
  ): void | Promise<void> | unknown;

  canExecute?(ctx: CommandContext, args?: unknown): boolean;
}
