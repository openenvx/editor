import type { ToolbarBuilder } from '../builders/toolbar-builder';
import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { CommandContext } from '../runtime/types';

export abstract class ToolbarContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.Toolbar;

  abstract contribute(builder: ToolbarBuilder, ctx: CommandContext): void;
}

export type {
  ToolbarCommandItemDescriptor,
  ToolbarDropdownItemDescriptor,
  ToolbarItemDescriptor,
  ToolbarSeparatorItemDescriptor,
} from '../builders/toolbar-builder';
