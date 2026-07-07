import type { MenuBuilder } from '../builders/menu-builder';
import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { ContributionBuildContext } from '../i18n/localize';

export abstract class ContextMenuContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.ContextMenu;

  abstract contribute(
    builder: MenuBuilder,
    ctx: ContributionBuildContext
  ): void;
}
