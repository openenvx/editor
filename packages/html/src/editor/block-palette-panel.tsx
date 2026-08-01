import { getActivePage } from '@openenvx/core';
import { extensionBlockStore } from '@openenvx/headless';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import type { Layer } from '@xmazu/openenvxee-schema';
import { memo, useCallback, useSyncExternalStore } from 'react';

import { defaultBlockRegistry } from '../block-registry';
import { findBlock, getPageRootId } from '../tree/block-tree';

import styles from './html-editor-pane.module.css';

function resolveInsertParentId(
  layers: Layer[],
  selectedId: string | null,
  rootId: string | null
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
  const config = defaultBlockRegistry.get(found.block.type);
  if (config?.acceptsChildren) {
    return found.block.id;
  }
  return found.parentId ?? rootId;
}

export const BlockPalettePanel = memo(() => {
  const { executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const extensionBlocks = useSyncExternalStore(
    extensionBlockStore.subscribe,
    extensionBlockStore.getSnapshot,
    extensionBlockStore.getSnapshot
  );

  const handleInsert = useCallback(
    (blockType: string) => {
      if (!(scene && selection)) {
        return;
      }
      const page = getActivePage(scene, selection.activePageId);
      const selectedId =
        selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
      const rootId = getPageRootId(page);
      const parentId = resolveInsertParentId(page.layers, selectedId, rootId);
      if (!parentId) {
        return;
      }
      void executeCommand('html.insertBlock', {
        type: blockType,
        parentId,
        index: Number.POSITIVE_INFINITY,
      });
    },
    [executeCommand, scene, selection]
  );

  const handleExtensionInsert = useCallback(
    (insertCommandId: string) => {
      void executeCommand(insertCommandId);
    },
    [executeCommand]
  );

  return (
    <div className={styles.palettePanel}>
      {defaultBlockRegistry.getPaletteBlocks().map((block) => (
        <button
          className={styles.paletteItem}
          key={block.type}
          onClick={() => handleInsert(block.type)}
          type="button"
        >
          {block.label}
        </button>
      ))}
      {extensionBlocks.map((block) => (
        <button
          className={styles.paletteItem}
          key={block.id}
          onClick={() => handleExtensionInsert(block.insertCommandId)}
          type="button"
        >
          {block.label}
        </button>
      ))}
    </div>
  );
});
