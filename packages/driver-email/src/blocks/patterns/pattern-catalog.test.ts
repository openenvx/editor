import { describe, expect, it } from 'vitest';

import {
  emailPatternCatalog,
  filterPatternCatalog,
  headerBlock,
  patternGroups,
} from './index';

describe('emailPatternCatalog', () => {
  it('lists Header and Article patterns', () => {
    expect(emailPatternCatalog.map((entry) => entry.block.type)).toEqual([
      headerBlock.type,
      'email.articleWithImage',
    ]);
    expect(patternGroups(emailPatternCatalog)).toEqual(['Headers', 'Articles']);
  });

  it('filters by group and search query', () => {
    expect(
      filterPatternCatalog(emailPatternCatalog, '', 'Headers')
    ).toHaveLength(1);
    expect(
      filterPatternCatalog(emailPatternCatalog, '', 'Articles')
    ).toHaveLength(1);
    expect(
      filterPatternCatalog(emailPatternCatalog, '', 'Footers')
    ).toHaveLength(0);
    expect(
      filterPatternCatalog(emailPatternCatalog, 'navigation', null)
    ).toHaveLength(1);
    expect(
      filterPatternCatalog(emailPatternCatalog, 'furniture', null)
    ).toHaveLength(1);
    expect(
      filterPatternCatalog(emailPatternCatalog, 'invoice', null)
    ).toHaveLength(0);
  });
});
