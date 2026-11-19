import type { Artboard, ValidationError } from '@openenvx/editor/schema';
import { Contribution, ContributionPoint } from '@openenvx/studio';

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
}
