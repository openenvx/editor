import type { ContributionBuildContext } from '@openenvx/core';

import type { MenuBuilder } from '../builders/menu-builder';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class ContextMenuContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.ContextMenu;

  abstract contribute(
    builder: MenuBuilder,
    ctx: ContributionBuildContext
  ): void;
}
