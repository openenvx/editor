import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core';
import { isLayerVisible } from '@openenvx/core';
import type { Layer } from '@openenvx/schema';

export interface BlockSortDraft {
  activeId: string;
  /** Original parent when the drag started. */
  sourceParentId: string;
  /** Parent currently used for sort/placeholder preview. */
  parentId: string;
  orderedIds: string[];
  /**
   * When set, show a blue insertion placeholder at this index under `parentId`
   * (cross-parent preview). Same-parent reorder leaves this unset and uses the
   * dragging item's own placeholder.
   */
  placeholderIndex?: number;
}

export interface BlockDragData {
  type: 'block';
  blockId: string;
  parentId: string | null;
  index: number;
  acceptsChildren: boolean;
}

export interface ZoneDragData {
  type: 'zone';
  parentId: string;
}

export type BlockDndData = BlockDragData | ZoneDragData;

export interface ResolvedBlockDrop {
  parentId: string;
  index: number;
}

/**
 * Reorder visible siblings per draft while hidden siblings keep their slots.
 */
export function mergeVisibleDraftIntoFullOrder(
  children: readonly Layer[],
  draftVisibleIds: readonly string[]
): string[] {
  const draftQueue = [...draftVisibleIds];
  return children.map((child) => {
    if (!isLayerVisible(child)) {
      return child.id;
    }
    const next = draftQueue.shift();
    return next ?? child.id;
  });
}

export function resolveSameParentSortFromDraft(
  activeId: string,
  fullSiblingIdsBefore: readonly string[],
  children: readonly Layer[],
  draft: BlockSortDraft
): ResolvedBlockDrop | null {
  const fullAfter = mergeVisibleDraftIntoFullOrder(children, draft.orderedIds);
  const nextIndex = fullAfter.indexOf(activeId);
  const currentIndex = fullSiblingIdsBefore.indexOf(activeId);
  if (nextIndex === -1 || currentIndex === -1 || nextIndex === currentIndex) {
    return null;
  }
  return { parentId: draft.parentId, index: nextIndex };
}

/**
 * Drop rules for HTML content DnD:
 * - Over a nestable block (flex/grid/root) → append inside that block.
 * - Over a leaf block → place as a sibling at that block's index.
 * - Over a container zone → append inside that container.
 * - Reject cycles, root siblings, locked targets, and parents that do not accept children.
 */
export function resolveBlockDrop(args: {
  activeId: string;
  activeParentId: string | null;
  activeIndex: number;
  over: BlockDndData;
  wouldCreateCycle: boolean;
  targetParentAcceptsChildren: boolean;
  targetParentLocked: boolean;
}): ResolvedBlockDrop | null {
  if (args.wouldCreateCycle || args.targetParentLocked) {
    return null;
  }
  if (!args.targetParentAcceptsChildren) {
    return null;
  }

  const overBlockAcceptsChildren =
    args.over.type === 'block' && args.over.acceptsChildren;

  if (args.over.type === 'zone') {
    if (args.over.parentId === args.activeId) {
      return null;
    }
    return {
      parentId: args.over.parentId,
      index: Number.POSITIVE_INFINITY,
    };
  }

  if (args.over.blockId === args.activeId) {
    return null;
  }

  if (overBlockAcceptsChildren) {
    return {
      parentId: args.over.blockId,
      index: Number.POSITIVE_INFINITY,
    };
  }

  if (args.over.parentId === null) {
    return null;
  }

  if (
    args.activeParentId === args.over.parentId &&
    args.activeIndex === args.over.index
  ) {
    return null;
  }

  return {
    parentId: args.over.parentId,
    index: args.over.index,
  };
}

export function dropTargetParentId(over: BlockDndData): string | null {
  if (over.type === 'zone') {
    return over.parentId;
  }
  if (over.acceptsChildren) {
    return over.blockId;
  }
  return over.parentId;
}

/**
 * Single commit path for drag-end: draft placeholder, same-parent reorder, or drop rules.
 */
export function resolveBlockDragEnd(args: {
  active: BlockDragData;
  over: BlockDndData;
  draft: BlockSortDraft | null;
  activeParentFullChildIds: readonly string[];
  activeParentChildren: readonly Layer[];
  wouldCreateCycle: boolean;
  targetParentAcceptsChildren: boolean;
  targetParentLocked: boolean;
}): ResolvedBlockDrop | null {
  if (args.targetParentLocked) {
    return null;
  }

  const { active, over, draft } = args;

  if (draft && typeof draft.placeholderIndex === 'number') {
    if (
      args.wouldCreateCycle ||
      draft.parentId === active.blockId ||
      !args.targetParentAcceptsChildren
    ) {
      return null;
    }
    return { parentId: draft.parentId, index: draft.placeholderIndex };
  }

  if (
    draft &&
    draft.placeholderIndex === undefined &&
    active.parentId !== null &&
    draft.parentId === draft.sourceParentId &&
    active.parentId === draft.sourceParentId
  ) {
    const fromDraft = resolveSameParentSortFromDraft(
      active.blockId,
      args.activeParentFullChildIds,
      args.activeParentChildren,
      draft
    );
    if (fromDraft) {
      return fromDraft;
    }
    return null;
  }

  return resolveBlockDrop({
    activeId: active.blockId,
    activeParentId: active.parentId,
    activeIndex: active.index,
    over,
    wouldCreateCycle: args.wouldCreateCycle,
    targetParentAcceptsChildren: args.targetParentAcceptsChildren,
    targetParentLocked: args.targetParentLocked,
  });
}

/** Prefer leaf blocks over nestable containers when both are under the pointer. */
export const blockCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    const blocks = pointerCollisions.filter(
      (collision) =>
        typeof collision.id === 'string' && !collision.id.startsWith('zone:')
    );
    if (blocks.length > 0) {
      return [...blocks].toSorted((a, b) => {
        const aData = a.data?.current;
        const bData = b.data?.current;
        const aNest =
          isBlockDndData(aData) &&
          aData.type === 'block' &&
          aData.acceptsChildren
            ? 1
            : 0;
        const bNest =
          isBlockDndData(bData) &&
          bData.type === 'block' &&
          bData.acceptsChildren
            ? 1
            : 0;
        return aNest - bNest;
      });
    }
    return pointerCollisions;
  }
  return closestCenter(args);
};

function isBlockDragData(value: unknown): value is BlockDragData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.type === 'block' &&
    typeof record.blockId === 'string' &&
    (typeof record.parentId === 'string' || record.parentId === null) &&
    typeof record.index === 'number' &&
    typeof record.acceptsChildren === 'boolean'
  );
}

function isZoneDragData(value: unknown): value is ZoneDragData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.type === 'zone' && typeof record.parentId === 'string';
}

export function isBlockDndData(value: unknown): value is BlockDndData {
  return isBlockDragData(value) || isZoneDragData(value);
}
