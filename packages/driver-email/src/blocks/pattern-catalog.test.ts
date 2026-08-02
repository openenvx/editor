import { describe, expect, it } from 'vitest';

import { headerBlock } from './pattern-blocks';
import {
  emailPatternCatalog,
  filterPatternCatalog,
  patternGroups,
} from './pattern-catalog';

describe('emailPatternCatalog', () => {
  it('lists Header under Headers', () => {
    expect(emailPatternCatalog[0]?.block.type).toBe(headerBlock.type);
    expect(patternGroups(emailPatternCatalog)).toEqual(['Headers']);
  });

  it('filters by group and search query', () => {
    expect(filterPatternCatalog(emailPatternCatalog, '', 'Headers')).toHaveLength(
      1
    );
    expect(filterPatternCatalog(emailPatternCatalog, '', 'Footers')).toHaveLength(
      0
    );
    expect(
      filterPatternCatalog(emailPatternCatalog, 'navigation', null)
    ).toHaveLength(1);
    expect(
      filterPatternCatalog(emailPatternCatalog, 'invoice', null)
    ).toHaveLength(0);
  });
});
