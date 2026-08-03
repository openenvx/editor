import type { Scene } from '@openenvx/core';
import type { ViewDescriptor } from '@openenvx/headless';
import { useEffect, type Dispatch, type SetStateAction } from 'react';

import { getSelectionExpandIds } from './get-selection-expand-ids';

/**
 * On layer selection, expand the selected node and its ancestors so the row is
 * visible in a default-collapsed Layers tree.
 */
export function useViewTreeSelectionSync(
  view: ViewDescriptor,
  selectedLayerIds: Set<string>,
  scene: Scene,
  setCollapsed: Dispatch<SetStateAction<Set<string>>>
): void {
  const viewSelection = view.viewSelection;

  useEffect(() => {
    if (viewSelection !== 'layer' || selectedLayerIds.size === 0) {
      return;
    }
    const expandIds = getSelectionExpandIds(scene, selectedLayerIds);
    if (expandIds.size === 0) {
      return;
    }
    setCollapsed((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of expandIds) {
        if (next.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [scene, selectedLayerIds, setCollapsed, viewSelection]);
}
