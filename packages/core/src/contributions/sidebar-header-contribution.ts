import type { ContributionBuildContext } from '../backbone';
import type { SidebarHeaderBuilder } from '../builders/sidebar-header-builder';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

/**
 * Replaces the default title header for a single view container
 * (one activity-bar panel). Other containers keep the default header.
 * Lowest {@link priority} wins when multiple contributions share a containerId.
 */
export abstract class SidebarHeaderContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.SidebarHeader;

  /** View container id this header applies to (e.g. `workbench.sidebar`). */
  abstract readonly containerId: string;
  /** Lower wins. Default 0. */
  priority?: number;

  abstract contribute(
    builder: SidebarHeaderBuilder,
    ctx: ContributionBuildContext
  ): void;
}

export type {
  SidebarHeaderActionDescriptor,
  SidebarHeaderDescriptor,
  SidebarHeaderTitleBinding,
} from '../builders/sidebar-header-builder';
