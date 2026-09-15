import type Konva from 'konva';

import type { CanvasStageLayer } from '../canvas-stage-types';
import type { FlattenedStageLayer } from '../flatten-layer-surface';

/** Named layer ancestors of a Konva node (parent groups/widgets). */
export function collectAncestorLayerIds(
  node: Konva.Node,
  knownIds: ReadonlySet<string>
): string[] {
  const ids: string[] = [];
  let current: Konva.Node | null = node.getParent();
  while (current) {
    const id = current.name?.() ?? '';
    if (id && knownIds.has(id)) {
      ids.push(id);
    }
    current = current.getParent();
  }
  return ids;
}

function walkDescendants(entry: CanvasStageLayer, into: string[]): void {
  for (const child of entry.children ?? []) {
    into.push(child.layer.id);
    walkDescendants(child, into);
  }
}

/** Nested children of a flattened stage entry (still carries the tree). */
export function collectDescendantLayerIds(
  layers: readonly FlattenedStageLayer[],
  layerId: string
): string[] {
  const entry = layers.find((item) => item.layer.id === layerId);
  if (!entry) {
    return [];
  }
  const ids: string[] = [];
  walkDescendants(entry, ids);
  return ids;
}
