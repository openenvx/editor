/** Minimal node lookup for opaque scene documents from `@openenvx/editor`. */
export function findNodeInSceneDocument(
  scene: unknown,
  layerId: string
): { props?: unknown } | null {
  if (!scene || typeof scene !== 'object') {
    return null;
  }
  const artboards = (scene as { artboards?: unknown }).artboards;
  if (!Array.isArray(artboards)) {
    return null;
  }
  for (const artboard of artboards) {
    if (!artboard || typeof artboard !== 'object') {
      continue;
    }
    const nodes = (artboard as { nodes?: unknown }).nodes;
    if (!Array.isArray(nodes)) {
      continue;
    }
    const found = walkNodes(nodes, layerId);
    if (found) {
      return found;
    }
  }
  return null;
}

function walkNodes(
  nodes: unknown[],
  layerId: string
): { props?: unknown } | null {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue;
    }
    const record = node as { id?: string; props?: unknown; children?: unknown };
    if (record.id === layerId) {
      return record;
    }
    const children = record.children;
    if (Array.isArray(children)) {
      const nested = walkNodes(children as unknown[], layerId);
      if (nested) {
        return nested;
      }
    }
    if (children && typeof children === 'object' && !Array.isArray(children)) {
      const items = Object.values(children as Record<string, unknown>).filter(
        Array.isArray
      );
      for (const bucket of items) {
        const nested = walkNodes(bucket as unknown[], layerId);
        if (nested) {
          return nested;
        }
      }
    }
  }
  return null;
}
