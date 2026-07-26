import type { Layer } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  mergeVisibleDraftIntoFullOrder,
  resolveBlockDragEnd,
  resolveBlockDrop,
  resolveSameParentSortFromDraft,
} from './block-dnd';

function layer(id: string, visible = true): Layer {
  return {
    id,
    type: 'html.paragraph',
    visible,
    data: {},
  };
}

describe('mergeVisibleDraftIntoFullOrder', () => {
  it('keeps hidden siblings in place while reordering visible ids', () => {
    const children = [layer('h0', false), layer('a'), layer('h1', false), layer('b')];
    expect(mergeVisibleDraftIntoFullOrder(children, ['b', 'a'])).toEqual([
      'h0',
      'b',
      'h1',
      'a',
    ]);
  });
});

describe('resolveSameParentSortFromDraft', () => {
  it('returns full-list index after visible reorder', () => {
    const children = [layer('h0', false), layer('a'), layer('b')];
    const result = resolveSameParentSortFromDraft(
      'a',
      ['h0', 'a', 'b'],
      children,
      { parentId: 'root', orderedIds: ['b', 'a'] }
    );
    expect(result).toEqual({ parentId: 'root', index: 2 });
  });

  it('returns null when full order is unchanged', () => {
    const children = [layer('a'), layer('b')];
    expect(
      resolveSameParentSortFromDraft('a', ['a', 'b'], children, {
        parentId: 'root',
        orderedIds: ['a', 'b'],
      })
    ).toBeNull();
  });
});

describe('resolveBlockDrop', () => {
  it('places over a block as a sibling at that index', () => {
    expect(
      resolveBlockDrop({
        activeId: 'a',
        activeParentId: 'root',
        activeIndex: 0,
        over: {
          type: 'block',
          blockId: 'b',
          parentId: 'root',
          index: 2,
        },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: true,
        targetParentLocked: false,
      })
    ).toEqual({ parentId: 'root', index: 2 });
  });

  it('does not nest into a leaf when dropping on that leaf', () => {
    const result = resolveBlockDrop({
      activeId: 'a',
      activeParentId: 'root',
      activeIndex: 0,
      over: {
        type: 'block',
        blockId: 'heading',
        parentId: 'root',
        index: 1,
      },
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(result).toEqual({ parentId: 'root', index: 1 });
    expect(result?.parentId).not.toBe('heading');
  });

  it('appends inside a container zone', () => {
    expect(
      resolveBlockDrop({
        activeId: 'a',
        activeParentId: 'root',
        activeIndex: 0,
        over: { type: 'zone', parentId: 'box' },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: true,
        targetParentLocked: false,
      })
    ).toEqual({ parentId: 'box', index: Number.POSITIVE_INFINITY });
  });

  it('rejects drops that would create a cycle', () => {
    expect(
      resolveBlockDrop({
        activeId: 'box',
        activeParentId: 'root',
        activeIndex: 0,
        over: { type: 'zone', parentId: 'child' },
        wouldCreateCycle: true,
        targetParentAcceptsChildren: true,
        targetParentLocked: false,
      })
    ).toBeNull();
  });

  it('rejects drops into a locked parent', () => {
    expect(
      resolveBlockDrop({
        activeId: 'a',
        activeParentId: 'root',
        activeIndex: 0,
        over: { type: 'zone', parentId: 'locked-box' },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: true,
        targetParentLocked: true,
      })
    ).toBeNull();
  });

  it('rejects sibling drops when the parent cannot accept children', () => {
    expect(
      resolveBlockDrop({
        activeId: 'a',
        activeParentId: 'root',
        activeIndex: 0,
        over: {
          type: 'block',
          blockId: 'b',
          parentId: 'leaf',
          index: 0,
        },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: false,
        targetParentLocked: false,
      })
    ).toBeNull();
  });

  it('rejects no-op same-index drops', () => {
    expect(
      resolveBlockDrop({
        activeId: 'a',
        activeParentId: 'root',
        activeIndex: 1,
        over: {
          type: 'block',
          blockId: 'a',
          parentId: 'root',
          index: 1,
        },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: true,
        targetParentLocked: false,
      })
    ).toBeNull();
  });
});

describe('resolveBlockDragEnd', () => {
  const active = {
    type: 'block' as const,
    blockId: 'a',
    parentId: 'root',
    index: 1,
  };

  it('commits same-parent reorder via draft using full child indexes', () => {
    const children = [layer('h0', false), layer('a'), layer('b')];
    const resolved = resolveBlockDragEnd({
      active,
      over: {
        type: 'block',
        blockId: 'b',
        parentId: 'root',
        index: 2,
      },
      draft: { parentId: 'root', orderedIds: ['b', 'a'] },
      activeParentFullChildIds: ['h0', 'a', 'b'],
      activeParentChildren: children,
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(resolved).toEqual({ parentId: 'root', index: 2 });
  });

  it('does not fall through to visible index when same-parent draft is unchanged', () => {
    const children = [layer('h0', false), layer('a'), layer('b')];
    const resolved = resolveBlockDragEnd({
      active,
      over: {
        type: 'block',
        blockId: 'a',
        parentId: 'root',
        index: 1,
      },
      draft: { parentId: 'root', orderedIds: ['a', 'b'] },
      activeParentFullChildIds: ['h0', 'a', 'b'],
      activeParentChildren: children,
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(resolved).toBeNull();
  });
});
