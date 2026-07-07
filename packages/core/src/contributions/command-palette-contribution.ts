import type { CommandPaletteBuilder } from '../builders/command-palette-builder';
import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { ContributionBuildContext } from '../i18n/localize';

export abstract class CommandPaletteContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.CommandPalette;

  abstract contribute(
    builder: CommandPaletteBuilder,
    ctx: ContributionBuildContext
  ): void;
}
