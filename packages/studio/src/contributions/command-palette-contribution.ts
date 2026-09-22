import type { ContributionBuildContext } from '../backbone';
import type { CommandPaletteBuilder } from '../builders/command-palette-builder';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export abstract class CommandPaletteContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.CommandPalette;

  abstract contribute(
    builder: CommandPaletteBuilder,
    ctx: ContributionBuildContext
  ): void;
}
