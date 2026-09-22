import { getPageRootId, resolveInsertParentId } from '@openenvx/html-driver';
import { getActiveArtboard } from '@openenvx/studio';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/studio/react';
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
      const page = getActiveArtboard(scene, selection.activeArtboardId);
      const selectedId =
        selection.primaryNodeId ?? selection.selectedNodeIds[0] ?? null;
      const rootId = getPageRootId(page, 'email.root');
      const parentId = resolveInsertParentId(
        page.nodes,
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
