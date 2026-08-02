import { getActivePage } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import { getPageRootId, resolveInsertParentId } from '@openenvx/html';
import { memo, useCallback } from 'react';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from '../block-registry';

import styles from './email-editor-pane.module.css';

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
