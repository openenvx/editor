import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core';
import { isLayerVisible } from '@openenvx/core';
import type { Layer } from '@openenvx/schema';

/** True when every visible child hugs content (e.g. email.imageLink row). */
export function childrenUseInlineChrome(
  layers: readonly Layer[],
  chromeDisplayFor: (
    type: string
  ) => 'block' | 'inline' | 'contents' | undefined
): boolean {
  const visible = layers.filter(isLayerVisible);
  return (
    visible.length > 0 &&
    visible.every((layer) => chromeDisplayFor(layer.type) === 'inline')
  );
}

/**
 * Config axis wins; otherwise inline-chrome siblings get a horizontal row
 * (vertical insert markers between left/right neighbors).
 */
export function resolveInsertLineAxis(
  configAxis: 'vertical' | 'horizontal' | undefined,
  inlineChromeChildren: boolean
): 'vertical' | 'horizontal' | undefined {
  if (configAxis) {
    return configAxis;
  }
  return inlineChromeChildren ? 'vertical' : undefined;
}

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
  /**
   * Wrapping-flex nest preview: highlight the whole container instead of a cell
   * index marker (avoids “below the container” vs “lands inside” mismatch).
   * Nowrap flex and grid use insert lines via placeholderIndex instead.
   */
  containerPreview?: boolean;
}

/**
 * When true, nest preview highlights the whole container (append).
 * When false, show an insert line at the sibling index (nowrap flex / grid).
 */
export function usesContainerNestPreview(
  type: string,
  data: Record<string, unknown> = {}
): boolean {
  if (type === 'html.flex') {
    // Default wrap is on; only nowrap gets linear insert lines.
    return data.wrap !== 'false';
  }
  return false;
}

/** Insert marker axis for flex/grid/columns children (column flex → horizontal line). */
export function insertLineIsVertical(
  parentType: string,
  parentData: Record<string, unknown>,
  insertLineAxis?: 'vertical' | 'horizontal'
): boolean {
  if (insertLineAxis === 'vertical') {
    return true;
  }
  if (insertLineAxis === 'horizontal') {
    return false;
  }
  if (parentType === 'html.flex') {
    return parentData.direction !== 'column';
  }
  return parentType === 'html.grid';
}

/** Clear cross-parent nest preview when pointer returns to the source container. */
export function cancelCrossParentDraftOnSourceParent(args: {
  current: BlockSortDraft | null;
  activeId: string;
  sourceParentId: string;
  sourceVisibleIds: readonly string[];
}): BlockSortDraft | null {
  if (
    args.current === null ||
    typeof args.current.placeholderIndex !== 'number'
  ) {
    return null;
  }
  return {
    activeId: args.activeId,
    sourceParentId: args.sourceParentId,
    parentId: args.sourceParentId,
    orderedIds: [...args.sourceVisibleIds],
  };
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
 * Grid/flex drop previews must stay put when collision re-targets to the
 * nestable itself or an ancestor after layout/measure. Otherwise draft flips
 * (grid ↔ root) every measure pass and React hits max update depth.
 */
export function shouldKeepCrossParentDraft(
  current: BlockSortDraft | null,
  nestableParentId: string,
  isAncestorOfLockedParent?: (
    ancestorId: string,
    lockedParentId: string
  ) => boolean
): boolean {
  if (current === null || typeof current.placeholderIndex !== 'number') {
    return false;
  }
  if (current.parentId === nestableParentId) {
    return true;
  }
  return (
    isAncestorOfLockedParent?.(nestableParentId, current.parentId) === true
  );
}

/**
 * While a cross-parent placeholder is active, ignore nestable/zone hits on the
 * locked parent or its ancestors (common after measure / chrome hover). Leaf
 * hits inside the locked parent still update index; other parents can switch.
 */
export function shouldIgnoreOverWhileCrossParent(args: {
  current: BlockSortDraft | null;
  over: BlockDndData;
  isAncestorOfLockedParent: (
    ancestorId: string,
    lockedParentId: string
  ) => boolean;
}): boolean {
  const { current, over, isAncestorOfLockedParent } = args;
  if (current === null || typeof current.placeholderIndex !== 'number') {
    return false;
  }
  const locked = current.parentId;
  if (over.type === 'zone') {
    return (
      over.parentId === locked ||
      isAncestorOfLockedParent(over.parentId, locked)
    );
  }
  if (over.acceptsChildren) {
    return (
      over.blockId === locked || isAncestorOfLockedParent(over.blockId, locked)
    );
  }
  return false;
}

export function buildCrossParentDraft(args: {
  activeId: string;
  sourceParentId: string;
  parentId: string;
  targetVisibleIds: readonly string[];
  placeholderIndex: number;
  containerPreview?: boolean;
}): BlockSortDraft {
  const orderedIds = args.targetVisibleIds.filter((id) => id !== args.activeId);
  return {
    activeId: args.activeId,
    sourceParentId: args.sourceParentId,
    parentId: args.parentId,
    orderedIds,
    placeholderIndex: Math.min(args.placeholderIndex, orderedIds.length),
    ...(args.containerPreview ? { containerPreview: true } : {}),
  };
}

export function sameCrossParentDraft(
  a: BlockSortDraft | null,
  b: BlockSortDraft
): boolean {
  return (
    a !== null &&
    a.activeId === b.activeId &&
    a.sourceParentId === b.sourceParentId &&
    a.parentId === b.parentId &&
    a.placeholderIndex === b.placeholderIndex &&
    a.containerPreview === b.containerPreview &&
    a.orderedIds.length === b.orderedIds.length &&
    a.orderedIds.every((id, i) => id === b.orderedIds[i])
  );
}

export function sameOrderedIds(
  a: readonly string[],
  b: readonly string[]
): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * Insert-line index for sort/nest preview (GrapesJS-style).
 * Same-parent: index of the active id in orderedIds.
 * Cross-parent: placeholderIndex among the target's visible children.
 *
 * Does not reorder the live tree — the source stays put; callers only move
 * an absolute insert marker among the unchanged siblings.
 */
export function sortInsertLineIndex(
  draft: BlockSortDraft | null,
  parentId: string
): number | null {
  if (!draft || draft.parentId !== parentId || draft.containerPreview) {
    return null;
  }
  if (typeof draft.placeholderIndex === 'number') {
    return draft.placeholderIndex;
  }
  const at = draft.orderedIds.indexOf(draft.activeId);
  return at === -1 ? null : at;
}

/**
 * Map an insert-line index onto a sibling that keeps its live layout slot.
 * Active id is excluded so the marker never attaches to the grayed source.
 */
export function insertLineTargetIds(
  siblingIds: readonly string[],
  activeId: string | null,
  lineIndex: number | null
): { beforeId: string | null; afterId: string | null } {
  if (lineIndex === null) {
    return { beforeId: null, afterId: null };
  }
  const others = siblingIds.filter((id) => id !== activeId);
  if (lineIndex < others.length) {
    return { beforeId: others[lineIndex] ?? null, afterId: null };
  }
  if (others.length > 0) {
    return { beforeId: null, afterId: others.at(-1) ?? null };
  }
  return { beforeId: null, afterId: null };
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
