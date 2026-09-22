import type { Artboard, ValidationError } from '#studio/schema';

import { Contribution } from '../runtime/contribution';
import { ContributionPoint } from '../runtime/contribution-point';

/**
 * Provider-owned normalize/validate rules for an artboard layout kind.
 * Registered via `ctx.register(new MyPageRules())` and keyed by `layout`.
 */
export abstract class PageRulesContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.PageRules;

  /** Layout string this contribution owns (e.g. `'absolute'`). */
  abstract readonly layout: string;

  abstract normalizeArtboard(artboard: Artboard): Artboard;

  abstract validateArtboard(artboard: Artboard): ValidationError[];

  /** @deprecated use normalizeArtboard */
  normalizePage(artboard: Artboard): Artboard {
    return this.normalizeArtboard(artboard);
  }

  /** @deprecated use validateArtboard */
  validatePage(artboard: Artboard): ValidationError[] {
    return this.validateArtboard(artboard);
  }
}
