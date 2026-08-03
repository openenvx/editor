import { walkLayers, type Page } from '@openenvx/core';

/** Ancestor layer ids from root to parent of `layerId` (excludes self). */
export function getLayerAncestorIds(page: Page, layerId: string): string[] {
  let ancestorIds: string[] = [];
  walkLayers(page.layers, (layer, path) => {
    if (layer.id === layerId) {
      ancestorIds = path.map((ancestor) => ancestor.id);
    }
  });
  return ancestorIds;
}
