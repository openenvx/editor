import { getActivePage, type Scene } from '@openenvx/core';

import { getLayerAncestorIds } from './get-layer-ancestor-ids';

/** Selected layer ids plus ancestors - expand so selection is visible. */
export function getSelectionExpandIds(
  scene: Scene,
  selectedLayerIds: Set<string>
): Set<string> {
  if (selectedLayerIds.size === 0) {
    return new Set();
  }
  const page = getActivePage(scene);
  const expandIds = new Set<string>();
  for (const layerId of selectedLayerIds) {
    expandIds.add(layerId);
    for (const ancestorId of getLayerAncestorIds(page, layerId)) {
      expandIds.add(ancestorId);
    }
  }
  return expandIds;
}
