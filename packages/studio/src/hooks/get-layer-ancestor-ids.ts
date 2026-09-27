import { walkNodes, type Artboard } from '#studio';

/** Ancestor layer ids from root to parent of `layerId` (excludes self). */
export function getNodeAncestorIds(page: Artboard, layerId: string): string[] {
  let ancestorIds: string[] = [];
  walkNodes(page.nodes, (layer, path) => {
    if (layer.id === layerId) {
      ancestorIds = path.map((ancestor) => ancestor.id);
    }
  });
  return ancestorIds;
}
