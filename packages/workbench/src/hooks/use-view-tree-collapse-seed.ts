import type { ViewTreeItem } from '@openenvx/headless';
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

/**
 * New nestable tree ids start collapsed. Once seen, user expand/collapse is kept
 * across scene edits (we never re-collapse a previously seen id).
 * `keepExpandedIds` skips the current selection path so seed cannot fight expand-on-select.
 */
export function useViewTreeCollapseSeed(
  items: ViewTreeItem[],
  setCollapsed: Dispatch<SetStateAction<Set<string>>>,
  keepExpandedIds?: Set<string>
): void {
  const seenParentIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const freshParentIds: string[] = [];
    for (const item of items) {
      if (!item.hasChildren || seenParentIds.current.has(item.id)) {
        continue;
      }
      seenParentIds.current.add(item.id);
      if (keepExpandedIds?.has(item.id)) {
        continue;
      }
      freshParentIds.push(item.id);
    }
    if (freshParentIds.length === 0) {
      return;
    }
    setCollapsed((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of freshParentIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items, keepExpandedIds, setCollapsed]);
}
