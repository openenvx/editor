import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { getActivePage } from '@openenvx/core';
import type { EditorPaneHostProps } from '@openenvx/headless';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import { defaultBlockRegistry } from '../block-registry';
import { getPageRootId } from '../tree/block-tree';
import { blockCollisionDetection, type BlockSortDraft } from './block-dnd';
import { BlockTreeRenderer } from './block-tree-renderer';
import {
  applyHtmlDragEnd,
  applyHtmlDragOver,
  applyHtmlDragStart,
} from './html-editor-drag';

import styles from './html-editor-pane.module.css';

export const HtmlEditorPane = memo((_props: EditorPaneHostProps) => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry = defaultBlockRegistry;
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [sortDraft, setSortDraft] = useState<BlockSortDraft | null>(null);
  const sortDraftRef = useRef<BlockSortDraft | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  // Preview indicators don't reflow layout; remeasuring during drag re-fires
  // onDragOver → setState loops (max update depth).
  // ponytail: BeforeDragging freezes droppable rects — scroll mid-drag can mis-hit.
  const measuring = useMemo(
    () => ({
      droppable: { strategy: MeasuringStrategy.BeforeDragging },
    }),
    []
  );

  const handleSelect = useCallback(
    (id: string) => {
      api.selectLayers([id]);
    },
    [api]
  );

  const clearSelection = useCallback(() => {
    if (editingBlockId) {
      return;
    }
    api.selectLayers([]);
  }, [api, editingBlockId]);

  const handleStartEdit = useCallback((id: string) => {
    setEditingBlockId(id);
  }, []);

  const handleCommitEdit = useCallback(
    (id: string, html: string) => {
      void executeCommand('html.updateBlockData', {
        id,
        patch: { html },
      });
      setEditingBlockId(null);
    },
    [executeCommand]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      void executeCommand('html.duplicateBlock', { id });
    },
    [executeCommand]
  );

  const handleRemove = useCallback(
    (id: string) => {
      void executeCommand('html.removeBlock', { id });
    },
    [executeCommand]
  );

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
      if (editingBlockId) {
        return;
      }
      event.preventDefault();
      clearSelection();
    },
    [clearSelection, editingBlockId]
  );

  const clearDrag = useCallback(() => {
    setSortDraft(null);
    sortDraftRef.current = null;
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      applyHtmlDragStart({
        scene,
        selection,
        activeData: event.active.data.current,
        sortDraftRef,
        setSortDraft,
      });
    },
    [scene, selection]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (!event.over) {
        return;
      }
      applyHtmlDragOver({
        scene,
        selection,
        activeData: event.active.data.current,
        overData: event.over.data.current,
        sortDraftRef,
        setSortDraft,
      });
    },
    [scene, selection]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const draft = sortDraftRef.current;
      applyHtmlDragEnd({
        scene,
        selection,
        activeData: event.active.data.current,
        overData: event.over?.data.current,
        draft,
        registry,
        clearDrag,
        executeCommand: (commandId, commandArgs) => {
          void executeCommand(commandId, commandArgs);
        },
      });
    },
    [clearDrag, executeCommand, registry, scene, selection]
  );

  if (!(scene && selection)) {
    return null;
  }

  const page = getActivePage(scene, selection.activePageId);
  const selectedId =
    selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
  const rootId = getPageRootId(page);

  return (
    <DndContext
      collisionDetection={blockCollisionDetection}
      measuring={measuring}
      sensors={sensors}
      onDragCancel={clearDrag}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <div
        aria-label="HTML blocks"
        className={[styles.pane, sortDraft ? styles.paneDragging : '']
          .filter(Boolean)
          .join(' ')}
        role="tree"
        tabIndex={0}
        onClick={handleCanvasClick}
        onKeyDown={handleCanvasKeyDown}
      >
        {rootId ? (
          <BlockTreeRenderer
            editingBlockId={editingBlockId}
            layers={page.layers}
            onCommitEdit={handleCommitEdit}
            onDuplicate={handleDuplicate}
            onRemove={handleRemove}
            onSelect={handleSelect}
            onStartEdit={handleStartEdit}
            registry={registry}
            scene={scene}
            selectedId={selectedId}
            sortDraft={sortDraft}
          />
        ) : (
          <p className={styles.empty}>No html.root block on this page.</p>
        )}
      </div>
    </DndContext>
  );
});
