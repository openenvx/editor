import type { ViewTreeItem } from '@openenvx/core';
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

  it('buildFlatTree does not claim siblings as children of empty containers', () => {
    const items = [
      item('section', 0, true),
      item('text', 0, false),
    ];
    const flat = buildFlatTree(items, new Set());
    expect(flat[1]!.parentId).toBeNull();
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

  it('findPointerTarget uses before zone on top half of leaf row', () => {
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

  it('findPointerTarget nests into the body of a container row', () => {
    const items = [flatItem('section', 0, true), flatItem('text', 0)];
    const rects = new Map([
      ['section', { top: 0, bottom: 28, height: 28 }],
      ['text', { top: 28, bottom: 56, height: 28 }],
    ]);
    expect(findPointerTarget(items, rects, 14)).toEqual({
      overId: 'section',
      zone: 'inside',
    });
  });

  it('findPointerTarget uses after below the list even for empty containers', () => {
    const items = [flatItem('text', 0), flatItem('section', 0, true)];
    const rects = new Map([
      ['text', { top: 0, bottom: 28, height: 28 }],
      ['section', { top: 28, bottom: 56, height: 28 }],
    ]);
    expect(findPointerTarget(items, rects, 80)).toEqual({
      overId: 'section',
      zone: 'after',
    });
  });

  it('getProjection returns before for first list position', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const projection = getProjection(items, 'b', 'a', 'before');
    expect(projection).toMatchObject({
      depth: 0,
      position: 'before',
    });
  });

  it('resolveMove commits before first item', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const projection = getProjection(items, 'b', 'a', 'before')!;
    const move = resolveMove(items, items, 'b', projection, new Set());
    expect(move).toMatchObject({
      position: 'before',
      target: { id: 'a' },
    });
  });

  it('getProjection nests into an empty container on inside zone', () => {
    const items = [
      flatItem('section', 0, true),
      flatItem('text', 0, false),
    ];
    const projection = getProjection(items, 'text', 'section', 'inside');
    expect(projection).toMatchObject({
      parentId: 'section',
      position: 'inside',
    });
    expect(isInvalidMove(items, items[1]!, projection!)).toBe(false);
  });

  it('getProjection returns before for first nested position', () => {
    const flat = [
      flatItem('group', 0, true),
      flatItem('child', 1, false, 'group', ['group']),
      flatItem('child2', 1, false, 'group', ['group']),
    ];
    const projection = getProjection(flat, 'child2', 'child', 'before');
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
    const projection = getProjection(flat, 'a', 'group', 'inside')!;
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

  it('getProjection nests into group on inside zone', () => {
    const items = [flatItem('a', 0), flatItem('group', 0, true)];
    const projection = getProjection(items, 'a', 'group', 'inside');
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
    const projection = getProjection(items, 'parent', 'child', 'before')!;
    expect(isInvalidMove(items, items[0]!, projection)).toBe(true);
  });

  it('getDropLineTop places line at top for before zone', () => {
    expect(getDropLineTop('before', { top: 28, bottom: 56 }, 0)).toBe(26);
  });

  it('isNoOpMove allows drop line for last item at end but skips commit', () => {
    const items = [flatItem('a', 0), flatItem('b', 0)];
    const projection = getProjection(items, 'b', 'b', 'after')!;
    expect(isInvalidMove(items, items[1]!, projection)).toBe(false);
    expect(isNoOpMove(items, items[1]!, projection)).toBe(true);
  });

  it('resolveMove nests into container on inside', () => {
    const items = [
      flatItem('section', 0, true),
      flatItem('text', 0, false),
    ];
    const projection = getProjection(items, 'text', 'section', 'inside')!;
    const move = resolveMove(items, items, 'text', projection, new Set());
    expect(move).toMatchObject({
      position: 'inside',
      target: { id: 'section' },
    });
  });
});
