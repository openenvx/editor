import { PageRulesContribution } from '@openenvx/core';
import type { Page, ValidationError } from '@openenvx/schema';

import { findPresetForPage, getDefaultPageDimensions } from './page-presets';

/** Absolute-layout page rules: default dims, preset inference, width/height required. */
export class AbsolutePageRules extends PageRulesContribution {
  readonly layout = 'absolute';

  normalizePage(page: Page): Page {
    const defaults = getDefaultPageDimensions();
    let next: Page = {
      ...page,
      height: page.height ?? defaults.height,
      width: page.width ?? defaults.width,
    };
    if (!next.presetId) {
      const inferred = findPresetForPage(next);
      if (inferred) {
        next = { ...next, presetId: inferred.id };
      }
    }
    return next;
  }

  validatePage(page: Page): ValidationError[] {
    if (typeof page.width !== 'number' || typeof page.height !== 'number') {
      return [
        {
          message: 'absolute layout requires width and height',
          path: `pages.${page.id}.layout`,
        },
      ];
    }
    return [];
  }
}
