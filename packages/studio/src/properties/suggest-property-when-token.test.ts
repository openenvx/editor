import { describe, expect, it } from 'vitest';

import { suggestPropertyWhenTokens } from './suggest-property-when-token';

describe('suggestPropertyWhenTokens', () => {
  it('suggests $ prefix for path-shaped bare tokens', () => {
    expect(
      suggestPropertyWhenTokens('selection.layer.data.enabled', [])
    ).toEqual(['$selection.layer.data.enabled']);
  });

  it('suggests similar context keys', () => {
    expect(
      suggestPropertyWhenTokens('scene.layer', [
        'scene.layerSelected',
        'scene.multiSelect',
        'editor.dirty',
      ])
    ).toEqual(['scene.layerSelected', 'scene.multiSelect']);
  });
});
