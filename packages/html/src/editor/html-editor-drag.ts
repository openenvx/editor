import { arrayMove } from '@dnd-kit/sortable';
import {
  getActivePage,
  isLayerDescendant,
  isLayerLocked,
  isLayerVisible,
} from '@openenvx/core';
import type { Selection } from '@openenvx/core';
import type { Layer, Scene } from '@openenvx/schema';
import type { MutableRefObject } from 'react';

import type { BlockRegistry } from '../block-registry';
import { findBlock, getBlockChildren } from '../tree/block-tree';
import {
  buildCrossParentDraft,
  dropTargetParentId,
  isBlockDndData,
  cancelCrossParentDraftOnSourceParent,
  usesContainerNestPreview,
  resolveBlockDragEnd,
  sameCrossParentDraft,
  sameOrderedIds,
  shouldIgnoreOverWhileCrossParent,
  shouldKeepCrossParentDraft,
  type BlockSortDraft,
} from './block-dnd';

export function visibleSiblingIds(layers: Layer[], parentId: string): string[] {
  const parent = findBlock(layers, parentId);
  if (!parent) {
    return [];
  }
  return getBlockChildren(parent.block)
    .filter(isLayerVisible)
    .map((child) => child.id);
}

export function applyHtmlDragStart(args: {
  scene: Scene | null | undefined;
  selection: Selection | null | undefined;
  activeData: unknown;
  sortDraftRef: MutableRefObject<BlockSortDraft | null>;
  setSortDraft: (draft: BlockSortDraft) => void;
}): void {
  const { scene, selection, activeData, sortDraftRef, setSortDraft } = args;
  if (!(scene && selection)) {
    return;
  }
  if (!(isBlockDndData(activeData) && activeData.type === 'block')) {
    return;
  }
  if (activeData.parentId === null) {
    return;
  }
  const page = getActivePage(scene, selection.activePageId);
  const draft: BlockSortDraft = {
    activeId: activeData.blockId,
    sourceParentId: activeData.parentId,
    parentId: activeData.parentId,
    orderedIds: visibleSiblingIds(page.layers, activeData.parentId),
  };
  sortDraftRef.current = draft;
  setSortDraft(draft);
}

export function applyHtmlDragOver(args: {
  scene: Scene | null | undefined;
  selection: Selection | null | undefined;
  activeData: unknown;
  overData: unknown;
  sortDraftRef: MutableRefObject<BlockSortDraft | null>;
  setSortDraft: (
    draft:
      | BlockSortDraft
      | null
      | ((current: BlockSortDraft | null) => BlockSortDraft | null)
  ) => void;
}): void {
  const { scene, selection, activeData, overData, sortDraftRef, setSortDraft } =
    args;
  if (!(scene && selection)) {
    return;
  }
  if (!(isBlockDndData(activeData) && activeData.type === 'block')) {
    return;
  }
  if (!isBlockDndData(overData)) {
    return;
  }
  const sourceParentId = activeData.parentId;
  if (sourceParentId === null) {
    return;
  }

  const page = getActivePage(scene, selection.activePageId);
  const isAncestorOfLocked = (ancestorId: string, lockedParentId: string) =>
    isLayerDescendant(page.layers, ancestorId, lockedParentId);

  const overSourceParentZone =
    overData.type === 'zone' && overData.parentId === sourceParentId;
  const overSourceParentNestable =
    overData.type === 'block' &&
    overData.acceptsChildren &&
    overData.blockId === sourceParentId;
  if (overSourceParentZone || overSourceParentNestable) {
    const next = cancelCrossParentDraftOnSourceParent({
      current: sortDraftRef.current,
      activeId: activeData.blockId,
      sourceParentId,
      sourceVisibleIds: visibleSiblingIds(page.layers, sourceParentId),
    });
    if (next) {
      sortDraftRef.current = next;
      setSortDraft(next);
    }
    return;
  }

  if (
    shouldIgnoreOverWhileCrossParent({
      current: sortDraftRef.current,
      over: overData,
      isAncestorOfLockedParent: isAncestorOfLocked,
    })
  ) {
    return;
  }

  const setCrossParentDraft = (
    parentId: string,
    placeholderIndex: number,
    containerPreview = false
  ) => {
    if (
      parentId === activeData.blockId ||
      isLayerDescendant(page.layers, activeData.blockId, parentId)
    ) {
      return;
    }
    const next = buildCrossParentDraft({
      activeId: activeData.blockId,
      sourceParentId,
      parentId,
      targetVisibleIds: visibleSiblingIds(page.layers, parentId),
      placeholderIndex,
      containerPreview,
    });
    if (sameCrossParentDraft(sortDraftRef.current, next)) {
      return;
    }
    sortDraftRef.current = next;
    setSortDraft(next);
  };

  const nestIntoParent = (parentId: string) => {
    const parent = findBlock(page.layers, parentId)?.block;
    const parentType = parent?.type ?? '';
    const parentData =
      parent && typeof parent.data === 'object' && parent.data !== null
        ? (parent.data as Record<string, unknown>)
        : {};
    const targetIds = visibleSiblingIds(page.layers, parentId).filter(
      (id) => id !== activeData.blockId
    );
    setCrossParentDraft(
      parentId,
      targetIds.length,
      usesContainerNestPreview(parentType, parentData)
    );
  };

  if (overData.type === 'zone') {
    if (overData.parentId === activeData.blockId) {
      return;
    }
    if (
      shouldKeepCrossParentDraft(
        sortDraftRef.current,
        overData.parentId,
        isAncestorOfLocked
      )
    ) {
      return;
    }
    nestIntoParent(overData.parentId);
    return;
  }

  if (overData.acceptsChildren && overData.blockId !== activeData.blockId) {
    if (
      shouldKeepCrossParentDraft(
        sortDraftRef.current,
        overData.blockId,
        isAncestorOfLocked
      )
    ) {
      return;
    }
    nestIntoParent(overData.blockId);
    return;
  }

  if (overData.parentId === sourceParentId) {
    setSortDraft((current) => {
      if (
        !current ||
        current.sourceParentId !== sourceParentId ||
        current.placeholderIndex !== undefined
      ) {
        const orderedIds = visibleSiblingIds(page.layers, sourceParentId);
        const oldIndex = orderedIds.indexOf(activeData.blockId);
        const newIndex = orderedIds.indexOf(overData.blockId);
        if (oldIndex === -1 || newIndex === -1) {
          return current;
        }
        const nextIds = arrayMove(orderedIds, oldIndex, newIndex);
        if (
          current &&
          current.placeholderIndex === undefined &&
          current.parentId === sourceParentId &&
          sameOrderedIds(current.orderedIds, nextIds)
        ) {
          return current;
        }
        const next: BlockSortDraft = {
          activeId: activeData.blockId,
          sourceParentId,
          parentId: sourceParentId,
          orderedIds: nextIds,
        };
        sortDraftRef.current = next;
        return next;
      }
      const oldIndex = current.orderedIds.indexOf(activeData.blockId);
      const newIndex = current.orderedIds.indexOf(overData.blockId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return current;
      }
      const next: BlockSortDraft = {
        activeId: activeData.blockId,
        sourceParentId,
        parentId: sourceParentId,
        orderedIds: arrayMove(current.orderedIds, oldIndex, newIndex),
      };
      sortDraftRef.current = next;
      return next;
    });
    return;
  }

  if (overData.parentId === null) {
    return;
  }

  const parent = findBlock(page.layers, overData.parentId)?.block;
  const parentType = parent?.type ?? '';
  const parentData =
    parent && typeof parent.data === 'object' && parent.data !== null
      ? (parent.data as Record<string, unknown>)
      : {};
  if (usesContainerNestPreview(parentType, parentData)) {
    nestIntoParent(overData.parentId);
    return;
  }

  const targetIds = visibleSiblingIds(page.layers, overData.parentId).filter(
    (id) => id !== activeData.blockId
  );
  const overVisibleIndex = targetIds.indexOf(overData.blockId);
  setCrossParentDraft(
    overData.parentId,
    overVisibleIndex === -1 ? targetIds.length : overVisibleIndex
  );
}

export function applyHtmlDragEnd(args: {
  scene: Scene | null | undefined;
  selection: Selection | null | undefined;
  activeData: unknown;
  overData: unknown;
  draft: BlockSortDraft | null;
  registry: BlockRegistry;
  clearDrag: () => void;
  executeCommand: (commandId: string, commandArgs?: unknown) => void;
}): void {
  const {
    scene,
    selection,
    activeData,
    overData,
    draft,
    registry,
    clearDrag,
    executeCommand,
  } = args;
  clearDrag();

  if (!(scene && selection)) {
    return;
  }
  if (!(isBlockDndData(activeData) && activeData.type === 'block')) {
    return;
  }
  if (!isBlockDndData(overData)) {
    return;
  }

  const page = getActivePage(scene, selection.activePageId);
  const targetParentId =
    draft && typeof draft.placeholderIndex === 'number'
      ? draft.parentId
      : dropTargetParentId(overData);
  if (!targetParentId) {
    return;
  }

  const targetParentBlock = findBlock(page.layers, targetParentId)?.block;
  const targetParentLocked = targetParentBlock
    ? isLayerLocked(targetParentBlock)
    : false;
  const targetParentAcceptsChildren =
    registry.get(targetParentBlock?.type ?? '')?.acceptsChildren === true;

  const wouldCreateCycle =
    targetParentId === activeData.blockId ||
    isLayerDescendant(page.layers, activeData.blockId, targetParentId);

  let activeParentFullChildIds: string[] = [];
  let activeParentChildren: Layer[] = [];
  if (activeData.parentId) {
    const activeParent = findBlock(page.layers, activeData.parentId);
    if (activeParent) {
      activeParentChildren = getBlockChildren(activeParent.block);
      activeParentFullChildIds = activeParentChildren.map((child) => child.id);
    }
  }

  const resolved = resolveBlockDragEnd({
    active: activeData,
    over: overData,
    draft,
    activeParentFullChildIds,
    activeParentChildren,
    wouldCreateCycle,
    targetParentAcceptsChildren,
    targetParentLocked,
  });
  if (!resolved) {
    return;
  }

  executeCommand('html.moveBlock', {
    id: activeData.blockId,
    newParentId: resolved.parentId,
    index: resolved.index,
  });
}
