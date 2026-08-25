import { getLayerChildren } from '@openenvx/core';
import type { Layer } from '@openenvx/core/schema';
import { BlockRegistry, findBlock, getPageRootId } from '@openenvx/html';

import { allEmailBlocks } from '../blocks/all-email-blocks';

const CONTENT_BLOCK_TYPES = new Set([
  'email.heading',
  'email.text',
  'email.button',
  'email.image',
  'email.imageLink',
  'email.link',
  'email.divider',
  'email.spacer',
]);

export interface PasteInsertTarget {
  parentId: string;
  index: number;
  /** Paste layers become children of a new `email.section` inserted here. */
  wrapInSection: boolean;
}

function siblingCount(layers: Layer[], parentId: string): number {
  const found = findBlock(layers, parentId);
  if (!found) {
    return 0;
  }
  return getLayerChildren(found.block).length;
}

let defaultRegistry: BlockRegistry | null = null;

function emailBlockRegistryForPaste(): BlockRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new BlockRegistry();
    for (const block of allEmailBlocks) {
      defaultRegistry.register(block);
    }
  }
  return defaultRegistry;
}

export function resolvePasteInsertTarget(
  layers: Layer[],
  selectedId: string | null,
  rootId: string | null,
  registry: BlockRegistry = emailBlockRegistryForPaste()
): PasteInsertTarget | null {
  if (!rootId) {
    return null;
  }

  if (!selectedId || selectedId === rootId) {
    return {
      parentId: rootId,
      index: siblingCount(layers, rootId),
      wrapInSection: true,
    };
  }

  const found = findBlock(layers, selectedId);
  if (!found) {
    return {
      parentId: rootId,
      index: siblingCount(layers, rootId),
      wrapInSection: true,
    };
  }

  const { block, index, parentId } = found;
  const type = block.type;

  if (type === 'email.column') {
    return {
      parentId: block.id,
      index: siblingCount(layers, block.id),
      wrapInSection: false,
    };
  }

  if (type === 'email.row') {
    return {
      parentId: parentId ?? rootId,
      index: index + 1,
      wrapInSection: false,
    };
  }

  if (CONTENT_BLOCK_TYPES.has(type)) {
    const insertParentId = parentId ?? rootId;
    const parent = findBlock(layers, insertParentId)?.block;
    if (insertParentId === rootId || parent?.type === 'email.root') {
      return {
        parentId: rootId,
        index: index + 1,
        wrapInSection: true,
      };
    }
    return {
      parentId: insertParentId,
      index: index + 1,
      wrapInSection: false,
    };
  }

  if (registry.get(type)?.acceptsChildren && type !== 'email.root') {
    return {
      parentId: parentId ?? rootId,
      index: index + 1,
      wrapInSection: false,
    };
  }

  return {
    parentId: rootId,
    index: siblingCount(layers, rootId),
    wrapInSection: true,
  };
}

export function resolveEmailPasteInsertTarget(
  layers: Layer[],
  selectedId: string | null
): PasteInsertTarget | null {
  const rootId = getPageRootId(
    { id: 'page', name: 'Page', layout: 'email', layers },
    'email.root'
  );
  return resolvePasteInsertTarget(layers, selectedId, rootId);
}
