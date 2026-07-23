import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { getActivePage } from '@openenvx/core';
import type { EditorPaneHostProps } from '@openenvx/headless';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import { memo, useCallback, type KeyboardEvent, type MouseEvent } from 'react';

import { defaultBlockRegistry } from '../block-registry';
import { getPageRootId } from '../tree/block-tree';
import { BlockTreeRenderer } from './block-tree-renderer';

import styles from './html-editor-pane.module.css';

export const HtmlEditorPane = memo((_props: EditorPaneHostProps) => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry = defaultBlockRegistry;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleSelect = useCallback(
    (id: string) => {
      api.selectLayers([id]);
    },
    [api]
  );

  const clearSelection = useCallback(() => {
    api.selectLayers([]);
  }, [api]);

  const handleCanvasClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      clearSelection();
    },
    [clearSelection]
  );

  const handleCanvasKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      clearSelection();
    },
    [clearSelection]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const overId = event.over?.id;
      if (typeof overId !== 'string' || !overId.startsWith('zone:')) {
        return;
      }
      const parentId = overId.slice('zone:'.length);
      const data = event.active.data.current as
        | { blockId?: string }
        | undefined;
      if (!data?.blockId) {
        return;
      }
      void executeCommand('html.moveBlock', {
        id: data.blockId,
        newParentId: parentId,
        index: Number.POSITIVE_INFINITY,
      });
    },
    [executeCommand]
  );

  if (!(scene && selection)) {
    return null;
  }

  const page = getActivePage(scene, selection.activePageId);
  const selectedId =
    selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
  const rootId = getPageRootId(page);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        aria-label="HTML blocks"
        className={styles.pane}
        role="tree"
        tabIndex={0}
        onClick={handleCanvasClick}
        onKeyDown={handleCanvasKeyDown}
      >
        {rootId ? (
          <BlockTreeRenderer
            layers={page.layers}
            onSelect={handleSelect}
            registry={registry}
            selectedId={selectedId}
          />
        ) : (
          <p className={styles.empty}>No html.root block on this page.</p>
        )}
      </div>
    </DndContext>
  );
});
