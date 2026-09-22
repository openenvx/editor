import { artboardSpaceSize, withArtboardRulesLayout } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { AbsolutePageRules } from './absolute-page-rules';
import { getDefaultPageDimensions } from './page-presets';

describe('AbsolutePageRules', () => {
  const rules = new AbsolutePageRules();

  it('fills default dimensions and infers preset id', () => {
    const defaults = getDefaultPageDimensions();
    const normalized = rules.normalizeArtboard(
      withArtboardRulesLayout(
        { id: 'p1', name: 'Page', nodes: [], space: {} },
        'absolute'
      )
    );
    const { width, height } = artboardSpaceSize(normalized);
    expect(width).toBe(defaults.width);
    expect(height).toBe(defaults.height);
    expect(normalized.physical?.presetId).toBe('a4-portrait');
  });

  it('validateArtboard passes after normalize fills space dimensions', () => {
    const normalized = rules.normalizeArtboard(
      withArtboardRulesLayout(
        { id: 'p1', name: 'Page', nodes: [], space: {} },
        'absolute'
      )
    );
    expect(rules.validateArtboard(normalized)).toEqual([]);
  });
});
