import { describe, expect, it } from 'vitest';

import type { CanvasStageLayer } from '../canvas-stage-types';
import type { FlattenedStageLayer } from '../flatten-layer-surface';
import { collectDescendantLayerIds } from './drag-snap-excludes';

function entry(
  id: string,
  children?: CanvasStageLayer[]
): FlattenedStageLayer {
  return {
    absoluteTransform: {
      height: 10,
      opacity: 1,
      rotation: 0,
      width: 10,
      x: 0,
      y: 0,
    },
    children,
    layer: { id, type: 'canvas.group' } as FlattenedStageLayer['layer'],
    view: { kind: 'group' } as FlattenedStageLayer['view'],
  };
}

describe('collectDescendantLayerIds', () => {
  it('returns nested child ids under a group', () => {
    const child = entry('child');
    const group = entry('group', [child]);
    // Flattened list still holds the tree on the group entry.
    expect(collectDescendantLayerIds([group, child], 'group')).toEqual([
      'child',
    ]);
  });

  it('returns empty for a leaf', () => {
    const leaf = entry('leaf');
    expect(collectDescendantLayerIds([leaf], 'leaf')).toEqual([]);
  });
});
