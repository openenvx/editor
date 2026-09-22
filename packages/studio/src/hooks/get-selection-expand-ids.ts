import { getActivePage, type Scene } from '#studio';

import { getLayerAncestorIds } from './get-layer-ancestor-ids';

/** Selected layer ids plus ancestors - expand so selection is visible. */
export function getSelectionExpandIds(
  scene: Scene,
  selectedNodeIds: Set<string>
): Set<string> {
  if (selectedNodeIds.size === 0) {
    return new Set();
  }
  const page = getActivePage(scene);
  const expandIds = new Set<string>();
  for (const layerId of selectedNodeIds) {
    expandIds.add(layerId);
    for (const ancestorId of getLayerAncestorIds(page, layerId)) {
      expandIds.add(ancestorId);
    }
  }
  return expandIds;
}
