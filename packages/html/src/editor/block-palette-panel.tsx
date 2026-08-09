import { getActivePage, extensionBlockStore } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import { memo, useCallback, useSyncExternalStore } from 'react';

import {
  BlockRegistryServiceId,
  defaultBlockRegistry,
} from '../block-registry';
import { getPageRootId } from '../tree/block-tree';
import { resolveInsertParentId } from '../tree/resolve-insert-parent-id';

import styles from './html-editor-pane.module.css';

export const BlockPalettePanel = memo(() => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry =
    api.getService(BlockRegistryServiceId) ?? defaultBlockRegistry;
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
      const parentId = resolveInsertParentId(
        page.layers,
        selectedId,
        rootId,
        registry
      );
      if (!parentId) {
        return;
      }
      void executeCommand('html.insertBlock', {
        type: blockType,
        parentId,
        index: Number.POSITIVE_INFINITY,
      });
    },
    [executeCommand, registry, scene, selection]
  );

  const handleExtensionInsert = useCallback(
    (insertCommandId: string) => {
      void executeCommand(insertCommandId);
    },
    [executeCommand]
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
