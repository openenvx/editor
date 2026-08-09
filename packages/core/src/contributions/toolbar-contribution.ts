import type { CommandContext } from '../backbone';
import type { ToolbarBuilder } from '../builders/toolbar-builder';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class ToolbarContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.Toolbar;

  abstract contribute(builder: ToolbarBuilder, ctx: CommandContext): void;
}

export type {
  ToolbarCommandItemDescriptor,
  ToolbarDropdownItemDescriptor,
  ToolbarItemDescriptor,
  ToolbarSeparatorItemDescriptor,
} from '../builders/toolbar-builder';
