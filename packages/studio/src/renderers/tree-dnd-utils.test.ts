import type { ViewTreeItem } from '@openenvx/headless';
import { describe, expect, it } from 'vitest';

import {
  buildFlatTree,
  findFirstChildInTree,
  findPointerTarget,
  getDropLineTop,
  getProjection,
  isInvalidMove,
  isNoOpMove,
  resolveMove,
} from './tree-dnd-utils';

function item(
  id: string,
  depth: number,
  hasChildren = false
): ViewTreeItem {
  return {
    depth,
    hasChildren,
    id,
    label: id,
    source: { id },
  };
}

function flatItem(
  id: string,
  depth: number,
  hasChildren = false,
  parentId: string | null = null,
  ancestorIds: string[] = []
) {
  return {
    ...item(id, depth, hasChildren),
    ancestorIds,
    flatIndex: 0,
    parentId,
  };
}

describe('tree-dnd-utils', () => {
  it('buildFlatTree skips collapsed children but keeps collapsed group', () => {
    const items = [
      item('parent', 0, true),
      item('child', 1),
      item('sibling', 0),
    ];
    const flat = buildFlatTree(items, new Set(['parent']));
    expect(flat.map((entry) => entry.id)).toStrictEqual(['parent', 'sibling']);
    expect(flat[0]!.hasChildren).toBe(true);
  });

  it('findPointerTarget uses before zone above first row', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const rects = new Map([
      ['a', { top: 0, bottom: 28, height: 28 }],
      ['b', { top: 28, bottom: 56, height: 28 }],
    ]);
    expect(findPointerTarget(items, rects, -4)).toEqual({
      overId: 'a',
      zone: 'before',
    });
  });

  it('findPointerTarget uses before zone on top half of row', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const rects = new Map([
      ['a', { top: 0, bottom: 28, height: 28 }],
      ['b', { top: 28, bottom: 56, height: 28 }],
    ]);
    expect(findPointerTarget(items, rects, 10)).toEqual({
      overId: 'a',
      zone: 'before',
    });
  });

  it('getProjection returns before for first list position', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const projection = getProjection(items, 'b', 'a', 0, 'before');
    expect(projection).toMatchObject({
      depth: 0,
      position: 'before',
    });
  });

  it('resolveMove commits before first item', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const projection = getProjection(items, 'b', 'a', 0, 'before')!;
    const move = resolveMove(items, items, 'b', projection, new Set());
    expect(move).toMatchObject({
      position: 'before',
      target: { id: 'a' },
    });
  });

  it('getProjection returns before for first nested position', () => {
    const flat = [
      flatItem('group', 0, true),
      flatItem('child', 1, false, 'group', ['group']),
      flatItem('child2', 1, false, 'group', ['group']),
    ];
    const projection = getProjection(flat, 'child2', 'child', 0, 'before');
    expect(projection).toMatchObject({
      depth: 1,
      position: 'before',
    });
  });

  it('resolveMove inserts before first child in collapsed group', () => {
    const allItems = [
      item('group', 0, true),
      item('child', 1),
      item('a', 0),
    ];
    const flat = [flatItem('group', 0, true), flatItem('a', 0)];
    const projection = getProjection(flat, 'a', 'group', 0, 'after')!;
    const move = resolveMove(flat, allItems, 'a', projection, new Set(['group']));
    expect(move).toMatchObject({
      position: 'before',
      target: { id: 'child' },
    });
  });

  it('findFirstChildInTree finds hidden child', () => {
    const allItems = [item('group', 0, true), item('child', 1)];
    expect(findFirstChildInTree(allItems, 'group')?.id).toBe('child');
  });

  it('getProjection nests into group at bottom of hovered row', () => {
    const items = [flatItem('a', 0), flatItem('group', 0, true)];
    const projection = getProjection(items, 'a', 'group', 0, 'after');
    expect(projection).toMatchObject({
      depth: 1,
      parentId: 'group',
      position: 'inside',
    });
  });

  it('isInvalidMove blocks dropping onto own descendant', () => {
    const items = [
      flatItem('parent', 0, true),
      flatItem('child', 1, false, 'parent', ['parent']),
    ];
    const projection = getProjection(items, 'parent', 'child', 0, 'before')!;
    expect(isInvalidMove(items, items[0]!, projection)).toBe(true);
  });

  it('getDropLineTop places line at top for before zone', () => {
    expect(getDropLineTop('before', { top: 28, bottom: 56 }, 0)).toBe(26);
  });

  it('isNoOpMove allows drop line for last item at end but skips commit', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const projection = getProjection(items, 'b', 'b', 0, 'after')!;
    expect(isInvalidMove(items, items[1]!, projection)).toBe(false);
    expect(isNoOpMove(items, items[1]!, projection)).toBe(true);
  });
});
