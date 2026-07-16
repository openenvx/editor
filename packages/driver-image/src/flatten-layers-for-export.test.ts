import type { Layer } from '@openenvx/core';
import { createDefaultTransform } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { flattenLayersForExport } from './flatten-layers-for-export';

function rectLayer(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): Layer {
  return {
    data: { fill: '#000' },
    id,
    transform: { ...createDefaultTransform(), x, y, width, height },
    type: 'canvas.rect',
  };
}

describe('flattenLayersForExport', () => {
  it('flattens grouped children with absolute transforms', () => {
    const flattened = flattenLayersForExport([
      {
        data: {
          children: [
            rectLayer('child-1', 10, 20, 100, 50),
            rectLayer('child-2', 40, 30, 80, 60),
          ],
        },
        id: 'group-1',
        transform: {
          ...createDefaultTransform(),
          x: 100,
          y: 200,
          width: 120,
          height: 80,
        },
        type: 'canvas.group',
      },
    ]);

    expect(flattened).toHaveLength(2);
    expect(flattened[0]?.layer.id).toBe('child-1');
    expect(flattened[0]?.transform).toMatchObject({ x: 110, y: 220 });
    expect(flattened[1]?.layer.id).toBe('child-2');
    expect(flattened[1]?.transform).toMatchObject({ x: 140, y: 230 });
  });

  it('skips hidden layers and their subtrees', () => {
    const flattened = flattenLayersForExport([
      { ...rectLayer('visible', 0, 0, 10, 10), visible: true },
      { ...rectLayer('hidden', 20, 20, 10, 10), visible: false },
      {
        data: {
          children: [rectLayer('hidden-child', 5, 5, 10, 10)],
        },
        id: 'hidden-group',
        transform: createDefaultTransform(),
        type: 'canvas.group',
        visible: false,
      },
    ]);

    expect(flattened.map((entry) => entry.layer.id)).toEqual(['visible']);
  });
});
