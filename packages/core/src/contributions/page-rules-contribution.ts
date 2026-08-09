import type { Page, ValidationError } from '@openenvx/core/schema';

import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';

/**
 * Provider-owned normalize/validate rules for a page layout kind.
 * Registered via `ctx.register(new MyPageRules())` and keyed by `layout`.
 */
export abstract class PageRulesContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.PageRules;

  /** Layout string this contribution owns (e.g. `'absolute'`). */
  abstract readonly layout: string;

  /** Fill layout-specific defaults. Idempotent. */
  abstract normalizePage(page: Page): Page;

  /** Layout-specific validation errors (empty if valid). */
  abstract validatePage(page: Page): ValidationError[];
}
