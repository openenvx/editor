import type { Layer } from '@openenvx/core';
import { createDefaultTransform } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  computeUnionBounds,
  createGroupFromLayers,
  groupRootLayers,
  toAbsoluteTransform,
  toRelativeTransform,
  ungroupLayer,
} from './group-layers';

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

describe('group-layers', () => {
  it('computeUnionBounds returns bounding box of layers', () => {
    const bounds = computeUnionBounds([
      rectLayer('a', 10, 20, 100, 50),
      rectLayer('b', 50, 40, 80, 60),
    ]);
    expect(bounds).toStrictEqual({ x: 10, y: 20, width: 120, height: 80 });
  });

  it('toRelativeTransform offsets position by group origin', () => {
    const layer = rectLayer('a', 30, 40, 100, 50);
    const relative = toRelativeTransform(layer, { x: 10, y: 20 });
    expect(relative.transform).toMatchObject({ x: 20, y: 20 });
  });

  it('toAbsoluteTransform adds group origin to position', () => {
    const layer = rectLayer('a', 20, 20, 100, 50);
    const absolute = toAbsoluteTransform(layer, { x: 10, y: 20 });
    expect(absolute.transform).toMatchObject({ x: 30, y: 40 });
  });

  it('createGroupFromLayers nests children with relative transforms', () => {
    const group = createGroupFromLayers(
      'group-1',
      [rectLayer('a', 10, 20, 100, 50), rectLayer('b', 50, 40, 80, 60)],
      { width: 800, height: 600 }
    );
    expect(group.type).toBe('canvas.group');
    expect(group.transform).toMatchObject({ x: 10, y: 20, width: 120, height: 80 });
    const children = (group.data as { children: Layer[] }).children;
    expect(children).toHaveLength(2);
    expect(children[0]?.transform).toMatchObject({ x: 0, y: 0 });
    expect(children[1]?.transform).toMatchObject({ x: 40, y: 20 });
  });

  it('groupRootLayers wraps selected root layers', () => {
    const roots = [
      rectLayer('a', 0, 0, 100, 100),
      rectLayer('b', 120, 0, 100, 100),
      rectLayer('c', 300, 0, 100, 100),
    ];
    const result = groupRootLayers(roots, ['a', 'b'], 'group-1', {
      width: 800,
      height: 600,
    });
    expect(result).toHaveLength(2);
    expect(result[0]?.type).toBe('canvas.group');
    expect(result[1]?.id).toBe('c');
  });

  it('ungroupLayer inserts children at the group index', () => {
    const group = createGroupFromLayers(
      'group-1',
      [rectLayer('a', 10, 20, 100, 50), rectLayer('b', 30, 20, 100, 50)],
      { width: 800, height: 600 }
    );
    const roots = [rectLayer('c', 0, 0, 50, 50), group, rectLayer('d', 200, 0, 50, 50)];
    const result = ungroupLayer(roots, 'group-1');
    expect(result.map((layer) => layer.id)).toStrictEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
  });

  it('ungroupLayer restores children to root with absolute transforms', () => {
    const group = createGroupFromLayers(
      'group-1',
      [rectLayer('a', 10, 20, 100, 50)],
      { width: 800, height: 600 }
    );
    const roots = [group];
    const result = ungroupLayer(roots, 'group-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('a');
    expect(result[0]?.transform).toMatchObject({ x: 10, y: 20 });
  });
});
