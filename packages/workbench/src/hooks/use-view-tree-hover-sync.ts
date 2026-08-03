import { getActivePage, type Scene } from '@openenvx/core';
import type { ViewDescriptor } from '@openenvx/headless';
import { useEffect, type Dispatch, type SetStateAction } from 'react';

import { getLayerAncestorIds } from './get-layer-ancestor-ids';

export function resolveViewHoveredIds(
  view: ViewDescriptor,
  hoveredLayerId: string | null,
  activePageId: string
): Set<string> {
  const viewHover = view.viewHover;
  if (!hoveredLayerId || viewHover === 'none') {
    return new Set();
  }
  if (viewHover === 'page') {
    return new Set(activePageId ? [activePageId] : []);
  }
  return new Set([hoveredLayerId]);
}

/**
 * While hovering a nested layer, expand ancestors so the hovered row is visible.
 */
export function useViewTreeHoverExpand(
  view: ViewDescriptor,
  hoveredLayerId: string | null,
  scene: Scene,
  setCollapsed: Dispatch<SetStateAction<Set<string>>>
): void {
  const viewHover = view.viewHover;

  useEffect(() => {
    if (viewHover !== 'layer' || !hoveredLayerId) {
      return;
    }
    const page = getActivePage(scene);
    const ancestorIds = getLayerAncestorIds(page, hoveredLayerId);
    if (ancestorIds.length === 0) {
      return;
    }
    setCollapsed((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of ancestorIds) {
        if (next.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [hoveredLayerId, scene, setCollapsed, viewHover]);
}
