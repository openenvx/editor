import { getNodeAncestorIds } from './get-layer-ancestor-ids';

/** Selected layer ids plus ancestors - expand so selection is visible. */
export function getSelectionExpandIds(
  scene: { artboards: { id: string; nodes: unknown[] }[] },
  selectedNodeIds: Set<string>,
  activeArtboardId: string
): Set<string> {
  if (selectedNodeIds.size === 0) {
    return new Set();
  }
  const page =
    scene.artboards.find((entry) => entry.id === activeArtboardId) ??
    scene.artboards[0];
  if (!page) {
    return new Set(selectedNodeIds);
  }
  const expandIds = new Set<string>();
  for (const layerId of selectedNodeIds) {
    expandIds.add(layerId);
    for (const ancestorId of getNodeAncestorIds(
      { nodes: page.nodes as import('@openenvx/editor/schema').DocumentNode[] },
      layerId
    )) {
      expandIds.add(ancestorId);
    }
  }
  return expandIds;
}
