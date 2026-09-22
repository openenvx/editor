import type { Document, DocumentNode } from '@openenvx/studio/schema';

import { getChildNodes, hasChildNodes } from '../scene/layer-tree';
import { nodeProps } from '../schema/node-helpers';

function* walkNodes(nodes: DocumentNode[]): Generator<DocumentNode> {
  for (const node of nodes) {
    yield node;
    if (hasChildNodes(node)) {
      yield* walkNodes(getChildNodes(node));
    }
  }
}

function extractAssetRefs(value: unknown, refs: Set<string>): void {
  if (typeof value === 'string') {
    if (value.startsWith('asset://')) {
      refs.add(value.slice('asset://'.length));
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractAssetRefs(item, refs);
    }
    return;
  }

  if (typeof value === 'object' && value !== null) {
    for (const entry of Object.values(value)) {
      extractAssetRefs(entry, refs);
    }
  }
}

export function collectAssetRefs(document: Document): Set<string> {
  const refs = new Set<string>();
  for (const artboard of document.artboards) {
    for (const node of walkNodes(artboard.nodes)) {
      extractAssetRefs(nodeProps(node), refs);
    }
  }
  return refs;
}
