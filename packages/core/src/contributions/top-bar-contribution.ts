import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

/**
 * Declares a workbench top bar. Pair with `ctx.registerTopBar(id, Component)`.
 * Highest {@link priority} wins when multiple contributions are visible;
 * later equal priority overwrites. Optional {@link when} uses context keys.
 */
export abstract class TopBarContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.TopBar;

  /** Registry key for `registerTopBar`. */
  abstract readonly id: string;
  /** Higher wins. Default 0. */
  priority?: number;
  when?: string;
}
