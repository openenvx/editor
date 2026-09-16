import type { CommandContext } from '../backbone';
import type { TopBarBuilder } from '../builders/top-bar-builder';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

/** Declares top-bar actions merged into the shell header when `layout.topBar` is true. */
export abstract class TopBarContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.TopBar;

  abstract contribute(builder: TopBarBuilder, ctx: CommandContext): void;
}

export type {
  TopBarCommandItemDescriptor,
  TopBarDropdownItemDescriptor,
  TopBarGroupItemDescriptor,
  TopBarItemDescriptor,
  TopBarPlacement,
  TopBarSeparatorItemDescriptor,
  TopBarStatusItemDescriptor,
  TopBarTitleBinding,
  TopBarTitleItemDescriptor,
} from '../builders/top-bar-builder';
