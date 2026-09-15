import type { Layer } from '@openenvx/core/schema';

import type { BlockRegistry } from '../block-registry';
import { findBlock } from './block-tree';

/** Parent for palette / gallery insert: selected container, else its parent, else root. */
export function resolveInsertParentId(
  layers: Layer[],
  selectedId: string | null,
  rootId: string | null,
  registry: BlockRegistry
): string | null {
  if (!rootId) {
    return null;
  }
  if (!selectedId) {
    return rootId;
  }
  const found = findBlock(layers, selectedId);
  if (!found) {
    return rootId;
  }
  const config = registry.get(found.block.type);
  if (config?.acceptsChildren) {
    return found.block.id;
  }
  return found.parentId ?? rootId;
}
