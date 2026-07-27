import { describe, expect, it, vi } from 'vitest';

import { createHtmlDemoScene } from '../create-html-demo-scene';
import {
  createBlockRegistry,
  createSortDraftMock,
  htmlDemoSelection,
} from '../test/html-editor-harness';
import type { BlockSortDraft } from './block-dnd';
import {
  applyHtmlDragEnd,
  applyHtmlDragOver,
  applyHtmlDragStart,
  visibleSiblingIds,
} from './html-editor-drag';

const selection = htmlDemoSelection;

function draftRef(current: BlockSortDraft | null = null) {
  return { current };
}

describe('visibleSiblingIds', () => {
  it('returns visible children or empty when parent missing', () => {
    const scene = createHtmlDemoScene();
    expect(visibleSiblingIds(scene.pages[0]!.layers, 'root')).toEqual([
      'heading-1',
      'text-1',
      'flex-1',
      'grid-1',
    ]);
    expect(visibleSiblingIds(scene.pages[0]!.layers, 'missing')).toEqual([]);
  });
});

describe('applyHtmlDragStart', () => {
  it('ignores invalid starts and seeds a same-parent draft', () => {
    const scene = createHtmlDemoScene();
    const sortDraftRef = draftRef();
    const setSortDraft = vi.fn();

    applyHtmlDragStart({
      scene: null,
      selection,
      activeData: { type: 'block', blockId: 'text-1', parentId: 'root', index: 1, acceptsChildren: false },
      sortDraftRef,
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();

    applyHtmlDragStart({
      scene,
      selection,
      activeData: { type: 'zone', parentId: 'root' },
      sortDraftRef,
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();

    applyHtmlDragStart({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'root',
        parentId: null,
        index: 0,
        acceptsChildren: true,
      },
      sortDraftRef,
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();

    applyHtmlDragStart({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'text-1',
        parentId: 'root',
        index: 1,
        acceptsChildren: false,
      },
      sortDraftRef,
      setSortDraft,
    });
    expect(setSortDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        activeId: 'text-1',
        parentId: 'root',
        sourceParentId: 'root',
      })
    );
    expect(sortDraftRef.current?.orderedIds).toContain('text-1');
  });
});

describe('applyHtmlDragOver', () => {
  it('nests into a zone and same-parent reorder', () => {
    const scene = createHtmlDemoScene();
    const { sortDraftRef, setSortDraft } = createSortDraftMock({
      passCurrentToUpdater: true,
    });

    const activeData = {
      type: 'block' as const,
      blockId: 'heading-1',
      parentId: 'root',
      index: 0,
      acceptsChildren: false,
    };

    applyHtmlDragOver({
      scene,
      selection,
      activeData,
      overData: { type: 'zone', parentId: 'flex-1' },
      sortDraftRef,
      setSortDraft,
    });
    expect(sortDraftRef.current).toEqual(
      expect.objectContaining({
        parentId: 'flex-1',
        placeholderIndex: expect.any(Number),
      })
    );

    // Cancel cross-parent when returning to source parent zone.
    applyHtmlDragOver({
      scene,
      selection,
      activeData,
      overData: { type: 'zone', parentId: 'root' },
      sortDraftRef,
      setSortDraft,
    });
    expect(sortDraftRef.current?.placeholderIndex).toBeUndefined();

    // Same-parent reorder over a sibling.
    applyHtmlDragOver({
      scene,
      selection,
      activeData,
      overData: {
        type: 'block',
        blockId: 'text-1',
        parentId: 'root',
        index: 1,
        acceptsChildren: false,
      },
      sortDraftRef,
      setSortDraft,
    });
    expect(sortDraftRef.current?.orderedIds[0]).toBe('text-1');
  });

  it('nests when hovering a nestable block', () => {
    const scene = createHtmlDemoScene();
    const { sortDraftRef, setSortDraft } = createSortDraftMock();

    applyHtmlDragOver({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: {
        type: 'block',
        blockId: 'grid-1',
        parentId: 'root',
        index: 3,
        acceptsChildren: true,
      },
      sortDraftRef,
      setSortDraft,
    });
    expect(sortDraftRef.current?.parentId).toBe('grid-1');
  });

  it('inserts beside a sibling in a nowrap flex parent', () => {
    const scene = createHtmlDemoScene();
    // Force flex to nowrap so insert-line path is used instead of container preview.
    const flex = (
      scene.pages[0]!.layers[0]!.data as {
        children: { id: string; data: Record<string, unknown> }[];
      }
    ).children.find((c) => c.id === 'flex-1')!;
    flex.data.wrap = 'false';

    const { sortDraftRef, setSortDraft } = createSortDraftMock();

    applyHtmlDragOver({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: {
        type: 'block',
        blockId: 'heading-2',
        parentId: 'flex-1',
        index: 0,
        acceptsChildren: false,
      },
      sortDraftRef,
      setSortDraft,
    });
    expect(sortDraftRef.current).toEqual(
      expect.objectContaining({
        parentId: 'flex-1',
        placeholderIndex: 0,
      })
    );
  });

  it('early-returns on invalid payloads', () => {
    const setSortDraft = vi.fn();
    applyHtmlDragOver({
      scene: null,
      selection,
      activeData: null,
      overData: null,
      sortDraftRef: draftRef(),
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();

    applyHtmlDragOver({
      scene: createHtmlDemoScene(),
      selection,
      activeData: { type: 'zone', parentId: 'root' },
      overData: { type: 'zone', parentId: 'flex-1' },
      sortDraftRef: draftRef(),
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();

    applyHtmlDragOver({
      scene: createHtmlDemoScene(),
      selection,
      activeData: {
        type: 'block',
        blockId: 'root',
        parentId: null,
        index: 0,
        acceptsChildren: true,
      },
      overData: { type: 'zone', parentId: 'flex-1' },
      sortDraftRef: draftRef(),
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();
  });
});

describe('applyHtmlDragEnd', () => {
  it('executes moveBlock for a resolved drop', () => {
    const scene = createHtmlDemoScene();
    const registry = createBlockRegistry();
    const clearDrag = vi.fn();
    const executeCommand = vi.fn();

    applyHtmlDragEnd({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: { type: 'zone', parentId: 'flex-1' },
      draft: {
        activeId: 'heading-1',
        sourceParentId: 'root',
        parentId: 'flex-1',
        orderedIds: [],
        placeholderIndex: 0,
      },
      registry,
      clearDrag,
      executeCommand,
    });

    expect(clearDrag).toHaveBeenCalled();
    expect(executeCommand).toHaveBeenCalledWith('html.moveBlock', {
      id: 'heading-1',
      newParentId: 'flex-1',
      index: 0,
    });
  });

  it('skips command when drop cannot resolve', () => {
    const scene = createHtmlDemoScene();
    const executeCommand = vi.fn();
    applyHtmlDragEnd({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: { type: 'zone', parentId: 'heading-1' },
      draft: null,
      registry: createBlockRegistry(),
      clearDrag: vi.fn(),
      executeCommand,
    });
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('covers early-exit and same-parent draft reorder branches', () => {
    const scene = createHtmlDemoScene();
    const { sortDraftRef, setSortDraft } = createSortDraftMock({
      passCurrentToUpdater: true,
      initial: {
        activeId: 'heading-1',
        sourceParentId: 'root',
        parentId: 'root',
        orderedIds: ['heading-1', 'text-1', 'flex-1', 'grid-1'],
      },
    });
    const activeData = {
      type: 'block' as const,
      blockId: 'heading-1',
      parentId: 'root',
      index: 0,
      acceptsChildren: false,
    };

    // Dropping onto own zone id is ignored.
    applyHtmlDragOver({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'flex-1',
        parentId: 'root',
        index: 2,
        acceptsChildren: true,
      },
      overData: { type: 'zone', parentId: 'flex-1' },
      sortDraftRef: draftRef(),
      setSortDraft: vi.fn(),
    });

    // Same-parent reorder with an existing draft.
    applyHtmlDragOver({
      scene,
      selection,
      activeData,
      overData: {
        type: 'block',
        blockId: 'text-1',
        parentId: 'root',
        index: 1,
        acceptsChildren: false,
      },
      sortDraftRef,
      setSortDraft,
    });
    expect(sortDraftRef.current?.orderedIds[0]).toBe('text-1');

    // No-op when hovering the same index again.
    applyHtmlDragOver({
      scene,
      selection,
      activeData: {
        ...activeData,
        blockId: 'text-1',
        index: 0,
      },
      overData: {
        type: 'block',
        blockId: 'text-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      sortDraftRef,
      setSortDraft,
    });

    // Root-level block with null parentId on over is ignored.
    applyHtmlDragOver({
      scene,
      selection,
      activeData,
      overData: {
        type: 'block',
        blockId: 'root',
        parentId: null,
        index: 0,
        acceptsChildren: true,
      },
      sortDraftRef: draftRef(),
      setSortDraft: vi.fn(),
    });
  });

  it('keeps cross-parent draft when re-hovering the locked nest target', () => {
    const scene = createHtmlDemoScene();
    const sortDraftRef = draftRef({
      activeId: 'heading-1',
      sourceParentId: 'root',
      parentId: 'flex-1',
      orderedIds: [],
      placeholderIndex: 0,
      containerPreview: true,
    });
    const setSortDraft = vi.fn();

    applyHtmlDragOver({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: {
        type: 'block',
        blockId: 'flex-1',
        parentId: 'root',
        index: 2,
        acceptsChildren: true,
      },
      sortDraftRef,
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();

    applyHtmlDragOver({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: { type: 'zone', parentId: 'flex-1' },
      sortDraftRef,
      setSortDraft,
    });
    expect(setSortDraft).not.toHaveBeenCalled();
  });

  it('nests into wrapping flex via sibling hover', () => {
    const scene = createHtmlDemoScene();
    const { sortDraftRef, setSortDraft } = createSortDraftMock();

    applyHtmlDragOver({
      scene,
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: {
        type: 'block',
        blockId: 'heading-2',
        parentId: 'flex-1',
        index: 0,
        acceptsChildren: false,
      },
      sortDraftRef,
      setSortDraft,
    });
    // Default flex wrap → container nest preview on parent.
    expect(sortDraftRef.current?.parentId).toBe('flex-1');
    expect(sortDraftRef.current?.containerPreview).toBe(true);
  });
});

describe('applyHtmlDragEnd guards', () => {
  const registry = createBlockRegistry();

  it('always clears drag state', () => {
    const clearDrag = vi.fn();
    applyHtmlDragEnd({
      scene: null,
      selection,
      activeData: null,
      overData: null,
      draft: null,
      registry,
      clearDrag,
      executeCommand: vi.fn(),
    });
    expect(clearDrag).toHaveBeenCalled();
  });

  it('does not move when active block dnd data is missing', () => {
    const executeCommand = vi.fn();
    applyHtmlDragEnd({
      scene: createHtmlDemoScene(),
      selection,
      activeData: { type: 'zone', parentId: 'root' },
      overData: { type: 'zone', parentId: 'flex-1' },
      draft: null,
      registry,
      clearDrag: vi.fn(),
      executeCommand,
    });
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('does not move when over block dnd data is incomplete', () => {
    const executeCommand = vi.fn();
    applyHtmlDragEnd({
      scene: createHtmlDemoScene(),
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: { type: 'block' },
      draft: null,
      registry,
      clearDrag: vi.fn(),
      executeCommand,
    });
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('commits same-parent reorder from draft without placeholder', () => {
    const executeCommand = vi.fn();
    applyHtmlDragEnd({
      scene: createHtmlDemoScene(),
      selection,
      activeData: {
        type: 'block',
        blockId: 'heading-1',
        parentId: 'root',
        index: 0,
        acceptsChildren: false,
      },
      overData: {
        type: 'block',
        blockId: 'text-1',
        parentId: 'root',
        index: 1,
        acceptsChildren: false,
      },
      draft: {
        activeId: 'heading-1',
        sourceParentId: 'root',
        parentId: 'root',
        orderedIds: ['text-1', 'heading-1', 'flex-1', 'grid-1'],
      },
      registry,
      clearDrag: vi.fn(),
      executeCommand,
    });
    expect(executeCommand).toHaveBeenCalledWith(
      'html.moveBlock',
      expect.objectContaining({ id: 'heading-1', newParentId: 'root' })
    );
  });
});
