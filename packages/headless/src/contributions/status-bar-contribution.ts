import type { CommandContext } from '@openenvx/core';

import type { StatusBarBuilder } from '../builders/status-bar-builder';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class StatusBarContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.StatusBar;

  abstract contribute(builder: StatusBarBuilder, ctx: CommandContext): void;
}

export type {
  StatusBarDropdownItemDescriptor,
  StatusBarItemDescriptor,
  StatusBarTextItemDescriptor,
} from '../builders/status-bar-builder';
