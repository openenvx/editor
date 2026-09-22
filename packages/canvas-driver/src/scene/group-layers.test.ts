import { getLayerChildren } from '@openenvx/studio/core';
import { nodeTransform } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { legacyLayer } from '../test/canvas-document-fixtures';
import {
  computeGroupOutlineBounds,
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
) {
  return legacyLayer({
    data: { fill: '#000' },
    id,
    transform: { x, y, width, height },
    type: 'canvas.rect',
  });
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
    expect(nodeTransform(relative)).toMatchObject({ x: 20, y: 20 });
  });

  it('toAbsoluteTransform adds group origin to position', () => {
    const layer = rectLayer('a', 20, 20, 100, 50);
    const absolute = toAbsoluteTransform(layer, { x: 10, y: 20 });
    expect(nodeTransform(absolute)).toMatchObject({ x: 30, y: 40 });
  });

  it('createGroupFromLayers nests children with relative transforms', () => {
    const group = createGroupFromLayers(
      'group-1',
      [rectLayer('a', 10, 20, 100, 50), rectLayer('b', 50, 40, 80, 60)],
      { space: { width: 800, height: 600 } }
    );
    expect(group.type).toBe('canvas.group');
    expect(nodeTransform(group)).toMatchObject({
      x: 10,
      y: 20,
      width: 120,
      height: 80,
    });
    const children = getLayerChildren(group);
    expect(children).toHaveLength(2);
    expect(nodeTransform(children[0]!)).toMatchObject({ x: 0, y: 0 });
    expect(nodeTransform(children[1]!)).toMatchObject({ x: 40, y: 20 });
  });

  it('groupRootLayers wraps selected root layers', () => {
    const roots = [
      rectLayer('a', 0, 0, 100, 100),
      rectLayer('b', 120, 0, 100, 100),
      rectLayer('c', 300, 0, 100, 100),
    ];
    const result = groupRootLayers(roots, ['a', 'b'], 'group-1', {
      space: { width: 800, height: 600 },
    });
    expect(result).toHaveLength(2);
    expect(result[0]?.type).toBe('canvas.group');
    expect(result[1]?.id).toBe('c');
  });

  it('ungroupLayer inserts children at the group index', () => {
    const group = createGroupFromLayers(
      'group-1',
      [rectLayer('a', 10, 20, 100, 50), rectLayer('b', 30, 20, 100, 50)],
      { space: { width: 800, height: 600 } }
    );
    const roots = [
      rectLayer('c', 0, 0, 50, 50),
      group,
      rectLayer('d', 200, 0, 50, 50),
    ];
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
      { space: { width: 800, height: 600 } }
    );
    const [child] = ungroupLayer([group], 'group-1');
    expect(nodeTransform(child!)).toMatchObject({ x: 10, y: 20 });
  });

  it('computeGroupOutlineBounds is the tight AABB of children', () => {
    const outline = computeGroupOutlineBounds(
      { width: 200, height: 200 },
      [rectLayer('a', 10, 20, 100, 50), rectLayer('b', 50, 40, 80, 60)]
    );
    expect(outline).toStrictEqual({ x: 10, y: 20, width: 120, height: 80 });
  });

  it('computeGroupOutlineBounds hugs the topmost child, not the stored box', () => {
    const outline = computeGroupOutlineBounds(
      { width: 500, height: 500 },
      [rectLayer('a', 0, 0, 50, 50)]
    );
    expect(outline).toStrictEqual({ x: 0, y: 0, width: 50, height: 50 });
  });

  it('computeGroupOutlineBounds follows a child past the left/top edges', () => {
    const outline = computeGroupOutlineBounds(
      { width: 200, height: 200 },
      [rectLayer('a', -20, -10, 100, 50)]
    );
    expect(outline).toStrictEqual({ x: -20, y: -10, width: 100, height: 50 });
  });
});
