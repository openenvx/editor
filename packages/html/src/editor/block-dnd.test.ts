import type { Layer } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from 'vitest';

import {
  buildCrossParentDraft,
  cancelCrossParentDraftOnSourceParent,
  childrenUseInlineChrome,
  insertLineIsVertical,
  insertLineTargetIds,
  isBlockDndData,
  mergeVisibleDraftIntoFullOrder,
  resolveBlockDragEnd,
  resolveBlockDrop,
  resolveInsertLineAxis,
  resolveSameParentSortFromDraft,
  sameCrossParentDraft,
  shouldIgnoreOverWhileCrossParent,
  shouldKeepCrossParentDraft,
  sortInsertLineIndex,
  usesContainerNestPreview,
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
      { parentId: 'root', sourceParentId: 'root', activeId: 'a', orderedIds: ['b', 'a'] }
    );
    expect(result).toEqual({ parentId: 'root', index: 2 });
  });

  it('returns null when full order is unchanged', () => {
    const children = [layer('a'), layer('b')];
    expect(
      resolveSameParentSortFromDraft('a', ['a', 'b'], children, {
        parentId: 'root',
        sourceParentId: 'root',
        activeId: 'a',
        orderedIds: ['a', 'b'],
      })
    ).toBeNull();
  });
});

describe('resolveBlockDrop', () => {
  it('places over a leaf block as a sibling at that index', () => {
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
          acceptsChildren: false,
        },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: true,
        targetParentLocked: false,
      })
    ).toEqual({ parentId: 'root', index: 2 });
  });

  it('nests into a flex/grid block instead of sibling-inserting', () => {
    expect(
      resolveBlockDrop({
        activeId: 'a',
        activeParentId: 'root',
        activeIndex: 0,
        over: {
          type: 'block',
          blockId: 'flex',
          parentId: 'root',
          index: 1,
          acceptsChildren: true,
        },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: true,
        targetParentLocked: false,
      })
    ).toEqual({ parentId: 'flex', index: Number.POSITIVE_INFINITY });
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
        acceptsChildren: false,
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
          acceptsChildren: false,
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
          acceptsChildren: false,
        },
        wouldCreateCycle: false,
        targetParentAcceptsChildren: true,
        targetParentLocked: false,
      })
    ).toBeNull();
  });
});

describe('shouldKeepCrossParentDraft', () => {
  it('keeps a leaf-hit draft when the nestable parent is hit after reflow', () => {
    // 2-col grid full → placeholder before B wraps B → pointer lands on grid.
    const afterLeafHit = buildCrossParentDraft({
      activeId: 'drag',
      sourceParentId: 'root',
      parentId: 'grid-1',
      targetVisibleIds: ['heading-3', 'text-3'],
      placeholderIndex: 1,
    });
    expect(shouldKeepCrossParentDraft(afterLeafHit, 'grid-1')).toBe(true);
    expect(shouldKeepCrossParentDraft(afterLeafHit, 'other')).toBe(false);
    expect(shouldKeepCrossParentDraft(null, 'grid-1')).toBe(false);
  });

  it('keeps a grid draft when collision lands on an ancestor nestable', () => {
    const gridDraft = buildCrossParentDraft({
      activeId: 'drag',
      sourceParentId: 'root',
      parentId: 'grid-1',
      targetVisibleIds: ['heading-3', 'text-3'],
      placeholderIndex: 2,
    });
    expect(
      shouldKeepCrossParentDraft(
        gridDraft,
        'root',
        (ancestorId, lockedParentId) =>
          ancestorId === 'root' && lockedParentId === 'grid-1'
      )
    ).toBe(true);
  });

  it('does not keep a same-parent reorder draft (no placeholderIndex)', () => {
    expect(
      shouldKeepCrossParentDraft(
        {
          activeId: 'a',
          sourceParentId: 'grid-1',
          parentId: 'grid-1',
          orderedIds: ['a', 'b'],
        },
        'grid-1'
      )
    ).toBe(false);
  });
});

describe('shouldIgnoreOverWhileCrossParent', () => {
  const gridDraft = buildCrossParentDraft({
    activeId: 'drag',
    sourceParentId: 'root',
    parentId: 'grid-1',
    targetVisibleIds: ['heading-3', 'text-3'],
    placeholderIndex: 2,
  });
  const isAncestor = (ancestorId: string, lockedParentId: string) =>
    ancestorId === 'root' && lockedParentId === 'grid-1';

  it('ignores ancestor nestable hits that oscillate with grid', () => {
    expect(
      shouldIgnoreOverWhileCrossParent({
        current: gridDraft,
        over: {
          type: 'block',
          blockId: 'root',
          parentId: null,
          index: 0,
          acceptsChildren: true,
        },
        isAncestorOfLockedParent: isAncestor,
      })
    ).toBe(true);
  });

  it('allows source-parent leaf hits so the preview can leave the grid', () => {
    expect(
      shouldIgnoreOverWhileCrossParent({
        current: gridDraft,
        over: {
          type: 'block',
          blockId: 'heading-1',
          parentId: 'root',
          index: 0,
          acceptsChildren: false,
        },
        isAncestorOfLockedParent: isAncestor,
      })
    ).toBe(false);
  });

  it('does not ignore leaf hits inside locked parent (pane may still force flex/grid append)', () => {
    expect(
      shouldIgnoreOverWhileCrossParent({
        current: gridDraft,
        over: {
          type: 'block',
          blockId: 'text-3',
          parentId: 'grid-1',
          index: 1,
          acceptsChildren: false,
        },
        isAncestorOfLockedParent: isAncestor,
      })
    ).toBe(false);
  });
});

describe('cancelCrossParentDraftOnSourceParent', () => {
  it('returns same-parent draft when cross-parent preview is active', () => {
    expect(
      cancelCrossParentDraftOnSourceParent({
        current: buildCrossParentDraft({
          activeId: 'drag',
          sourceParentId: 'root',
          parentId: 'grid-1',
          targetVisibleIds: ['a', 'b'],
          placeholderIndex: 2,
          containerPreview: true,
        }),
        activeId: 'drag',
        sourceParentId: 'root',
        sourceVisibleIds: ['drag', 'sib'],
      })
    ).toEqual({
      activeId: 'drag',
      sourceParentId: 'root',
      parentId: 'root',
      orderedIds: ['drag', 'sib'],
    });
  });

  it('returns null when already same-parent reorder', () => {
    expect(
      cancelCrossParentDraftOnSourceParent({
        current: {
          activeId: 'a',
          sourceParentId: 'root',
          parentId: 'root',
          orderedIds: ['b', 'a'],
        },
        activeId: 'a',
        sourceParentId: 'root',
        sourceVisibleIds: ['a', 'b'],
      })
    ).toBeNull();
  });
});

describe('usesContainerNestPreview', () => {
  it('uses insert lines for flex when wrap is off', () => {
    expect(usesContainerNestPreview('html.flex', { wrap: 'false' })).toBe(
      false
    );
  });

  it('uses container highlight for wrapping flex', () => {
    expect(usesContainerNestPreview('html.flex', { wrap: 'true' })).toBe(true);
    expect(usesContainerNestPreview('html.flex', {})).toBe(true);
  });

  it('uses insert lines for grid (no wrap — linear order marker)', () => {
    expect(usesContainerNestPreview('html.grid', { columns: 2 })).toBe(false);
  });

  it('is false for non layout blocks', () => {
    expect(usesContainerNestPreview('html.paragraph', {})).toBe(false);
  });
});

describe('insertLineIsVertical', () => {
  it('uses horizontal lines for column flex and vertical for row flex', () => {
    expect(insertLineIsVertical('html.flex', { direction: 'column' })).toBe(
      false
    );
    expect(insertLineIsVertical('html.flex', { direction: 'row' })).toBe(true);
    expect(insertLineIsVertical('html.flex', {})).toBe(true);
  });

  it('uses vertical lines for grid', () => {
    expect(insertLineIsVertical('html.grid', {})).toBe(true);
  });

  it('honors BlockConfig insertLineAxis over type heuristics', () => {
    expect(insertLineIsVertical('email.row', {}, 'vertical')).toBe(true);
    expect(insertLineIsVertical('html.flex', { direction: 'row' }, 'horizontal')).toBe(
      false
    );
  });
});

describe('resolveInsertLineAxis / childrenUseInlineChrome', () => {
  it('prefers config axis over inline-chrome siblings', () => {
    expect(resolveInsertLineAxis('horizontal', true)).toBe('horizontal');
    expect(resolveInsertLineAxis('vertical', true)).toBe('vertical');
  });

  it('uses vertical axis when all visible children are inline chrome', () => {
    expect(resolveInsertLineAxis(undefined, true)).toBe('vertical');
    expect(resolveInsertLineAxis(undefined, false)).toBeUndefined();
  });

  it('detects inline-chrome children', () => {
    expect(
      childrenUseInlineChrome(
        [
          { id: 'a', type: 'email.imageLink', data: {} },
          { id: 'b', type: 'email.imageLink', data: {} },
        ],
        (type) => (type === 'email.imageLink' ? 'inline' : 'block')
      )
    ).toBe(true);
    expect(
      childrenUseInlineChrome(
        [
          { id: 'a', type: 'email.imageLink', data: {} },
          { id: 'b', type: 'email.text', data: {} },
        ],
        (type) => (type === 'email.imageLink' ? 'inline' : 'block')
      )
    ).toBe(false);
  });
});

describe('buildCrossParentDraft', () => {
  it('excludes the active id and clamps placeholder to the end', () => {
    expect(
      buildCrossParentDraft({
        activeId: 'drag',
        sourceParentId: 'root',
        parentId: 'grid-1',
        targetVisibleIds: ['a', 'drag', 'b'],
        placeholderIndex: 99,
      })
    ).toEqual({
      activeId: 'drag',
      sourceParentId: 'root',
      parentId: 'grid-1',
      orderedIds: ['a', 'b'],
      placeholderIndex: 2,
    });
  });

  it('sameCrossParentDraft ignores identical previews', () => {
    const draft = buildCrossParentDraft({
      activeId: 'drag',
      sourceParentId: 'root',
      parentId: 'grid-1',
      targetVisibleIds: ['a', 'b'],
      placeholderIndex: 2,
      containerPreview: true,
    });
    expect(sameCrossParentDraft(draft, draft)).toBe(true);
    expect(
      sameCrossParentDraft(draft, {
        ...draft,
        placeholderIndex: 1,
      })
    ).toBe(false);
    expect(
      sameCrossParentDraft(draft, {
        ...draft,
        containerPreview: undefined,
      })
    ).toBe(false);
  });

  it('marks flex/grid nest drafts as container previews', () => {
    expect(
      buildCrossParentDraft({
        activeId: 'drag',
        sourceParentId: 'root',
        parentId: 'grid-1',
        targetVisibleIds: ['a', 'b'],
        placeholderIndex: 2,
        containerPreview: true,
      }).containerPreview
    ).toBe(true);
  });
});

describe('sortInsertLineIndex', () => {
  it('uses orderedIds position for same-parent sort', () => {
    expect(
      sortInsertLineIndex(
        {
          activeId: 'a',
          sourceParentId: 'root',
          parentId: 'root',
          orderedIds: ['b', 'a', 'c'],
        },
        'root'
      )
    ).toBe(1);
  });

  it('uses placeholderIndex for cross-parent insert', () => {
    expect(
      sortInsertLineIndex(
        buildCrossParentDraft({
          activeId: 'drag',
          sourceParentId: 'root',
          parentId: 'box',
          targetVisibleIds: ['a', 'b'],
          placeholderIndex: 2,
        }),
        'box'
      )
    ).toBe(2);
  });

  it('hides the line for flex/grid container preview', () => {
    expect(
      sortInsertLineIndex(
        buildCrossParentDraft({
          activeId: 'drag',
          sourceParentId: 'root',
          parentId: 'grid-1',
          targetVisibleIds: ['a', 'b'],
          placeholderIndex: 2,
          containerPreview: true,
        }),
        'grid-1'
      )
    ).toBeNull();
  });
});

describe('insertLineTargetIds', () => {
  it('never attaches the line to the active source sibling', () => {
    // Live order stays [a, b, c]; draft wants a between b and c.
    expect(insertLineTargetIds(['a', 'b', 'c'], 'a', 1)).toEqual({
      beforeId: 'c',
      afterId: null,
    });
  });

  it('places the line after the last sibling when inserting at the end', () => {
    expect(insertLineTargetIds(['a', 'b', 'c'], 'a', 2)).toEqual({
      beforeId: null,
      afterId: 'c',
    });
  });
});

describe('resolveBlockDragEnd', () => {
  const active = {
    type: 'block' as const,
    blockId: 'a',
    parentId: 'root',
    index: 1,
    acceptsChildren: false,
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
        acceptsChildren: false,
      },
      draft: {
        parentId: 'root',
        sourceParentId: 'root',
        activeId: 'a',
        orderedIds: ['b', 'a'],
      },
      activeParentFullChildIds: ['h0', 'a', 'b'],
      activeParentChildren: children,
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(resolved).toEqual({ parentId: 'root', index: 2 });
  });

  it('commits cross-parent placeholder draft into a nestable parent', () => {
    const resolved = resolveBlockDragEnd({
      active: {
        type: 'block',
        blockId: 'a',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      over: {
        type: 'block',
        blockId: 'flex',
        parentId: 'root',
        index: 1,
        acceptsChildren: true,
      },
      draft: {
        activeId: 'a',
        sourceParentId: 'root',
        parentId: 'flex',
        orderedIds: ['x'],
        placeholderIndex: 1,
      },
      activeParentFullChildIds: ['a', 'flex'],
      activeParentChildren: [layer('a'), layer('flex')],
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(resolved).toEqual({ parentId: 'flex', index: 1 });
  });

  it('commits containerPreview flex/grid draft at placeholderIndex (append)', () => {
    const resolved = resolveBlockDragEnd({
      active: {
        type: 'block',
        blockId: 'a',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      over: {
        type: 'block',
        blockId: 'cell',
        parentId: 'grid',
        index: 0,
        acceptsChildren: false,
      },
      draft: buildCrossParentDraft({
        activeId: 'a',
        sourceParentId: 'root',
        parentId: 'grid',
        targetVisibleIds: ['c1', 'c2'],
        placeholderIndex: 2,
        containerPreview: true,
      }),
      activeParentFullChildIds: ['a', 'grid'],
      activeParentChildren: [layer('a'), layer('grid')],
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(resolved).toEqual({ parentId: 'grid', index: 2 });
  });

  it('commits same-parent reorder when release target is the parent zone', () => {
    const children = [layer('h0', false), layer('a'), layer('b')];
    const resolved = resolveBlockDragEnd({
      active,
      over: { type: 'zone', parentId: 'root' },
      draft: {
        parentId: 'root',
        sourceParentId: 'root',
        activeId: 'a',
        orderedIds: ['b', 'a'],
      },
      activeParentFullChildIds: ['h0', 'a', 'b'],
      activeParentChildren: children,
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(resolved).toEqual({ parentId: 'root', index: 2 });
  });

  it('does not append when same-parent draft is unchanged', () => {
    const children = [layer('h0', false), layer('a'), layer('b')];
    const resolved = resolveBlockDragEnd({
      active,
      over: { type: 'zone', parentId: 'root' },
      draft: {
        parentId: 'root',
        sourceParentId: 'root',
        activeId: 'a',
        orderedIds: ['a', 'b'],
      },
      activeParentFullChildIds: ['h0', 'a', 'b'],
      activeParentChildren: children,
      wouldCreateCycle: false,
      targetParentAcceptsChildren: true,
      targetParentLocked: false,
    });
    expect(resolved).toBeNull();
  });
});

describe('isBlockDndData', () => {
  it('accepts block and zone payloads and rejects junk', () => {
    expect(
      isBlockDndData({
        type: 'block',
        blockId: 'a',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      })
    ).toBe(true);
    expect(
      isBlockDndData({
        type: 'block',
        blockId: 'a',
        parentId: null,
        index: 0,
        acceptsChildren: true,
      })
    ).toBe(true);
    expect(isBlockDndData({ type: 'zone', parentId: 'root' })).toBe(true);
    expect(isBlockDndData(null)).toBe(false);
    expect(isBlockDndData({ type: 'block' })).toBe(false);
    expect(isBlockDndData({ type: 'zone' })).toBe(false);
    expect(isBlockDndData({ type: 'block', blockId: 'a', parentId: 1 })).toBe(
      false
    );
  });
});
