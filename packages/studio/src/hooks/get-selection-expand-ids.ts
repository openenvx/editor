import { getActiveArtboard, type Document } from '#studio';

import { getNodeAncestorIds } from './get-layer-ancestor-ids';

/** Selected layer ids plus ancestors - expand so selection is visible. */
export function getSelectionExpandIds(
  scene: Document,
  selectedNodeIds: Set<string>
): Set<string> {
  if (selectedNodeIds.size === 0) {
    return new Set();
  }
  const page = getActiveArtboard(scene);
  const expandIds = new Set<string>();
  for (const layerId of selectedNodeIds) {
    expandIds.add(layerId);
    for (const ancestorId of getNodeAncestorIds(page, layerId)) {
      expandIds.add(ancestorId);
    }
  }
  return expandIds;
}
