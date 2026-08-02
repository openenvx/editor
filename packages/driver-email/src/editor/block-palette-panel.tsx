import { getActivePage } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import type { BlockRegistry } from '@openenvx/html';
import { findBlock, getPageRootId } from '@openenvx/html';
import type { Layer } from '@openenvx/schema';
import { memo, useCallback } from 'react';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from '../block-registry';

import styles from './email-editor-pane.module.css';

function resolveInsertParentId(
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

export const EmailBlockPalettePanel = memo(() => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry =
    api.getService(EmailBlockRegistryServiceId) ?? emailBlockRegistry;

  const handleInsert = useCallback(
    (blockType: string) => {
      if (!(scene && selection)) {
        return;
      }
      const page = getActivePage(scene, selection.activePageId);
      const selectedId =
        selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
      const rootId = getPageRootId(page, 'email.root');
      const parentId = resolveInsertParentId(
        page.layers,
        selectedId,
        rootId,
        registry
      );
      if (!parentId) {
        return;
      }
      void executeCommand('email.insertBlock', {
        type: blockType,
        parentId,
        index: Number.POSITIVE_INFINITY,
      });
    },
    [executeCommand, registry, scene, selection]
  );

  return (
    <div className={styles.palettePanel}>
      {registry.getPaletteBlocks().map((block) => (
        <button
          className={styles.paletteItem}
          key={block.type}
          onClick={() => handleInsert(block.type)}
          type="button"
        >
          {block.label}
        </button>
      ))}
    </div>
  );
});
