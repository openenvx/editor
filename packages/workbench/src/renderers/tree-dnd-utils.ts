import type { ViewTreeItem } from '@openenvx/headless';

const TREE_INDENT_PX = 8;
const TREE_BASE_PADDING_PX = 8;
const DROP_LINE_HEIGHT_PX = 2;
/** Edge strip for before/after on container rows; middle is nest-into. */
const CONTAINER_EDGE_PX = 8;

export type PointerZone = 'before' | 'after' | 'inside';

export interface FlatTreeItem extends ViewTreeItem {
  flatIndex: number;
  parentId: string | null;
  ancestorIds: string[];
}

export interface PointerTarget {
  overId: string;
  zone: PointerZone;
}

export interface DropProjection {
  depth: number;
  parentId: string | null;
  overId: string;
  position: 'before' | 'after' | 'inside';
  zone: PointerZone;
}

function isItemVisible(
  items: ViewTreeItem[],
  index: number,
  collapsed: Set<string>
): boolean {
  const item = items[index]!;
  if (item.depth === 0) {
    return true;
  }
  for (let i = index - 1; i >= 0; i -= 1) {
    const ancestor = items[i]!;
    if (ancestor.depth < item.depth) {
      if (ancestor.hasChildren && collapsed.has(ancestor.id)) {
        return false;
      }
      if (ancestor.depth === item.depth - 1) {
        return true;
      }
    }
  }
  return true;
}

export function buildFlatTree(
  items: ViewTreeItem[],
  collapsed: Set<string>
): FlatTreeItem[] {
  const flat: FlatTreeItem[] = [];
  const parentStack: string[] = [];

  for (let index = 0; index < items.length; index += 1) {
    if (!isItemVisible(items, index, collapsed)) {
      continue;
    }

    const item = items[index]!;
    while (parentStack.length > item.depth) {
      parentStack.pop();
    }

    const parentId = parentStack.length > 0 ? parentStack.at(-1)! : null;
    const ancestorIds = [...parentStack];

    flat.push({
      ...item,
      ancestorIds,
      flatIndex: index,
      parentId,
    });

    // Only push parents that actually show children — empty nestable rows
    // stay nest targets without claiming the next sibling as their child.
    const next = items[index + 1];
    if (
      item.hasChildren &&
      !collapsed.has(item.id) &&
      next &&
      next.depth > item.depth
    ) {
      parentStack.push(item.id);
    }
  }

  return flat;
}

export function findFirstChildInTree(
  allItems: ViewTreeItem[],
  parentId: string
): ViewTreeItem | null {
  let parentDepth: number | null = null;

  for (const item of allItems) {
    if (item.id === parentId) {
      parentDepth = item.depth;
      continue;
    }
    if (parentDepth !== null) {
      if (item.depth <= parentDepth) {
        break;
      }
      if (item.depth === parentDepth + 1) {
        return item;
      }
    }
  }

  return null;
}

function zoneForRow(
  item: FlatTreeItem,
  nextItem: FlatTreeItem | undefined,
  rect: Pick<DOMRect, 'top' | 'bottom' | 'height'>,
  clientY: number
): PointerZone {
  const y = clientY - rect.top;
  const edge = Math.min(CONTAINER_EDGE_PX, Math.floor(rect.height / 3));

  if (!item.hasChildren) {
    return y < rect.height / 2 ? 'before' : 'after';
  }

  // Containers: top edge = sibling before; body = nest into.
  if (y < edge) {
    return 'before';
  }

  // Bottom edge = sibling after only when the container has no visible kids
  // (empty or collapsed) — otherwise bottom-of-header looks like "first child".
  const showsChildren = Boolean(nextItem && nextItem.depth > item.depth);
  if (!showsChildren && y >= rect.height - edge) {
    return 'after';
  }

  return 'inside';
}

export function getProjection(
  items: FlatTreeItem[],
  activeId: string,
  overId: string,
  zone: PointerZone
): DropProjection | null {
  const overIndex = items.findIndex((item) => item.id === overId);
  const activeIndex = items.findIndex((item) => item.id === activeId);
  if (overIndex === -1 || activeIndex === -1) {
    return null;
  }

  const overItem = items[overIndex]!;

  if (zone === 'inside') {
    return {
      depth: overItem.depth + 1,
      overId,
      parentId: overItem.id,
      position: 'inside',
      zone,
    };
  }

  if (zone === 'before') {
    return {
      depth: overItem.depth,
      overId,
      parentId: overItem.parentId,
      position: 'before',
      zone,
    };
  }

  return {
    depth: overItem.depth,
    overId,
    parentId: overItem.parentId,
    position: 'after',
    zone,
  };
}

export function isInvalidMove(
  items: FlatTreeItem[],
  activeItem: FlatTreeItem,
  projection: DropProjection
): boolean {
  const overItem = items.find((item) => item.id === projection.overId);
  if (!overItem) {
    return true;
  }

  if (overItem.ancestorIds.includes(activeItem.id)) {
    return true;
  }

  if (projection.position === 'inside' && !overItem.hasChildren) {
    return true;
  }

  if (projection.position === 'inside' && overItem.id === activeItem.id) {
    return true;
  }

  return false;
}

export function resolveMove(
  items: FlatTreeItem[],
  allItems: ViewTreeItem[],
  activeId: string,
  projection: DropProjection,
  collapsed: Set<string>
): {
  target: FlatTreeItem | ViewTreeItem;
  position: 'before' | 'after' | 'inside';
} | null {
  const activeItem = items.find((item) => item.id === activeId);
  const overItem = items.find((item) => item.id === projection.overId);
  if (!activeItem || !overItem) {
    return null;
  }

  if (projection.position === 'inside' && overItem.id === activeItem.id) {
    return null;
  }

  if (projection.position === 'before') {
    return {
      position: 'before',
      target: overItem,
    };
  }

  if (projection.position === 'inside') {
    const firstChild = findFirstChildInTree(allItems, overItem.id);
    const groupCollapsed = collapsed.has(overItem.id);

    // Collapsed folder: insert before first child (= first inside parent).
    if (firstChild && groupCollapsed) {
      const flatChild = items.find((item) => item.id === firstChild.id);
      return {
        position: 'before',
        target: flatChild ?? firstChild,
      };
    }

    return {
      position: 'inside',
      target: overItem,
    };
  }

  if (projection.position === 'after' && overItem.id === activeItem.id) {
    return null;
  }

  return {
    position: 'after',
    target: overItem,
  };
}

export function treePaddingLeft(depth: number): number {
  return TREE_BASE_PADDING_PX + depth * TREE_INDENT_PX;
}

export function getDropLineTop(
  zone: Exclude<PointerZone, 'inside'>,
  rowRect: Pick<DOMRect, 'top' | 'bottom'>,
  containerTop: number
): number {
  if (zone === 'before') {
    return rowRect.top - containerTop - DROP_LINE_HEIGHT_PX;
  }
  return rowRect.bottom - containerTop - DROP_LINE_HEIGHT_PX;
}

export function findPointerTarget(
  items: FlatTreeItem[],
  rowRects: Map<string, Pick<DOMRect, 'top' | 'bottom' | 'height'>>,
  clientY: number
): PointerTarget | null {
  if (items.length === 0) {
    return null;
  }

  const firstItem = items[0]!;
  const firstRect = rowRects.get(firstItem.id);
  if (firstRect && clientY <= firstRect.top) {
    return { overId: firstItem.id, zone: 'before' };
  }

  const lastItem = items.at(-1)!;
  const lastRect = rowRects.get(lastItem.id);
  // Past the list = sibling after last row — never nest-into (even empty containers).
  if (lastRect && clientY >= lastRect.bottom) {
    return { overId: lastItem.id, zone: 'after' };
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    const rect = rowRects.get(item.id);
    if (!rect) {
      continue;
    }
    if (clientY >= rect.top && clientY < rect.bottom) {
      return {
        overId: item.id,
        zone: zoneForRow(item, items[index + 1], rect, clientY),
      };
    }
  }

  if (lastRect && clientY >= lastRect.top) {
    return { overId: lastItem.id, zone: 'after' };
  }

  return null;
}

export function isNoOpMove(
  items: FlatTreeItem[],
  activeItem: FlatTreeItem,
  projection: DropProjection
): boolean {
  const activeIndex = items.findIndex((item) => item.id === activeItem.id);
  const overIndex = items.findIndex((item) => item.id === projection.overId);

  if (projection.position === 'before' && overIndex === activeIndex) {
    return true;
  }

  if (
    projection.position === 'before' &&
    overIndex === activeIndex + 1 &&
    projection.depth === activeItem.depth &&
    activeItem.parentId === items[overIndex]?.parentId
  ) {
    return true;
  }

  if (
    projection.position === 'inside' &&
    projection.overId === activeItem.parentId
  ) {
    const lastChildIndex = items.findLastIndex(
      (item) => item.parentId === projection.overId
    );
    return lastChildIndex === activeIndex;
  }

  if (
    projection.position === 'after' &&
    overIndex === activeIndex &&
    projection.depth === activeItem.depth
  ) {
    return true;
  }

  return false;
}
