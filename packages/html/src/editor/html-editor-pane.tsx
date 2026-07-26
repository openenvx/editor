import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  getActivePage,
  isLayerDescendant,
  isLayerLocked,
  isLayerVisible,
} from '@openenvx/core';
import type { EditorPaneHostProps } from '@openenvx/headless';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import type { Layer } from '@openenvx/schema';
import {
  memo,
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import { defaultBlockRegistry } from '../block-registry';
import { findBlock, getBlockChildren, getPageRootId } from '../tree/block-tree';
import {
  blockCollisionDetection,
  dropTargetParentId,
  isBlockDndData,
  resolveBlockDragEnd,
  type BlockSortDraft,
} from './block-dnd';
import {
  BlockDragOverlayPreview,
  BlockTreeRenderer,
} from './block-tree-renderer';

import styles from './html-editor-pane.module.css';

function visibleSiblingIds(layers: Layer[], parentId: string): string[] {
  const parent = findBlock(layers, parentId);
  if (!parent) {
    return [];
  }
  return getBlockChildren(parent.block)
    .filter(isLayerVisible)
    .map((child) => child.id);
}

export const HtmlEditorPane = memo((_props: EditorPaneHostProps) => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry = defaultBlockRegistry;
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<Layer | null>(null);
  const [sortDraft, setSortDraft] = useState<BlockSortDraft | null>(null);
  const sortDraftRef = useRef<BlockSortDraft | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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
    setActiveLayer(null);
    setSortDraft(null);
    sortDraftRef.current = null;
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!(scene && selection)) {
        return;
      }
      const data = event.active.data.current;
      if (!(isBlockDndData(data) && data.type === 'block')) {
        return;
      }
      if (data.parentId === null) {
        return;
      }
      const page = getActivePage(scene, selection.activePageId);
      setActiveLayer(findBlock(page.layers, data.blockId)?.block ?? null);
      const draft: BlockSortDraft = {
        activeId: data.blockId,
        sourceParentId: data.parentId,
        parentId: data.parentId,
        orderedIds: visibleSiblingIds(page.layers, data.parentId),
      };
      sortDraftRef.current = draft;
      setSortDraft(draft);
    },
    [scene, selection]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!(over && scene && selection)) {
        return;
      }
      const activeData = active.data.current;
      const overData = over.data.current;
      if (!(isBlockDndData(activeData) && activeData.type === 'block')) {
        return;
      }
      if (!isBlockDndData(overData)) {
        return;
      }
      const sourceParentId = activeData.parentId;
      if (sourceParentId === null) {
        return;
      }

      const page = getActivePage(scene, selection.activePageId);

      const setCrossParentDraft = (
        parentId: string,
        placeholderIndex: number
      ) => {
        if (
          parentId === activeData.blockId ||
          isLayerDescendant(page.layers, activeData.blockId, parentId)
        ) {
          return;
        }
        const targetIds = visibleSiblingIds(page.layers, parentId).filter(
          (id) => id !== activeData.blockId
        );
        const next: BlockSortDraft = {
          activeId: activeData.blockId,
          sourceParentId,
          parentId,
          orderedIds: targetIds,
          placeholderIndex: Math.min(placeholderIndex, targetIds.length),
        };
        sortDraftRef.current = next;
        setSortDraft(next);
      };

      if (overData.type === 'zone') {
        if (overData.parentId === activeData.blockId) {
          return;
        }
        if (overData.parentId === sourceParentId) {
          return;
        }
        const targetIds = visibleSiblingIds(
          page.layers,
          overData.parentId
        ).filter((id) => id !== activeData.blockId);
        setCrossParentDraft(overData.parentId, targetIds.length);
        return;
      }

      // Hovering a nestable block (Flex/Grid/…) → show placeholder inside it.
      if (overData.acceptsChildren && overData.blockId !== activeData.blockId) {
        const targetIds = visibleSiblingIds(
          page.layers,
          overData.blockId
        ).filter((id) => id !== activeData.blockId);
        setCrossParentDraft(overData.blockId, targetIds.length);
        return;
      }

      if (overData.parentId === sourceParentId) {
        setSortDraft((current) => {
          if (
            !current ||
            current.sourceParentId !== sourceParentId ||
            current.placeholderIndex !== undefined
          ) {
            const orderedIds = visibleSiblingIds(page.layers, sourceParentId);
            const oldIndex = orderedIds.indexOf(activeData.blockId);
            const newIndex = orderedIds.indexOf(overData.blockId);
            if (oldIndex === -1 || newIndex === -1) {
              return current;
            }
            const next: BlockSortDraft = {
              activeId: activeData.blockId,
              sourceParentId,
              parentId: sourceParentId,
              orderedIds: arrayMove(orderedIds, oldIndex, newIndex),
            };
            sortDraftRef.current = next;
            return next;
          }
          const oldIndex = current.orderedIds.indexOf(activeData.blockId);
          const newIndex = current.orderedIds.indexOf(overData.blockId);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
            return current;
          }
          const next: BlockSortDraft = {
            activeId: activeData.blockId,
            sourceParentId,
            parentId: sourceParentId,
            orderedIds: arrayMove(current.orderedIds, oldIndex, newIndex),
          };
          sortDraftRef.current = next;
          return next;
        });
        return;
      }

      if (overData.parentId === null) {
        return;
      }

      const targetIds = visibleSiblingIds(
        page.layers,
        overData.parentId
      ).filter((id) => id !== activeData.blockId);
      const overVisibleIndex = targetIds.indexOf(overData.blockId);
      setCrossParentDraft(
        overData.parentId,
        overVisibleIndex === -1 ? targetIds.length : overVisibleIndex
      );
    },
    [scene, selection]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const draft = sortDraftRef.current;
      const { active, over } = event;
      clearDrag();

      if (!over || !scene || !selection) {
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;
      if (!(isBlockDndData(activeData) && activeData.type === 'block')) {
        return;
      }
      if (!isBlockDndData(overData)) {
        return;
      }

      const page = getActivePage(scene, selection.activePageId);
      const targetParentId =
        draft && typeof draft.placeholderIndex === 'number'
          ? draft.parentId
          : dropTargetParentId(overData);
      if (!targetParentId) {
        return;
      }

      const targetParentBlock = findBlock(page.layers, targetParentId)?.block;
      const targetParentLocked = targetParentBlock
        ? isLayerLocked(targetParentBlock)
        : false;
      const targetParentAcceptsChildren =
        registry.get(targetParentBlock?.type ?? '')?.acceptsChildren === true;

      const wouldCreateCycle =
        targetParentId === activeData.blockId ||
        isLayerDescendant(page.layers, activeData.blockId, targetParentId);

      let activeParentFullChildIds: string[] = [];
      let activeParentChildren: Layer[] = [];
      if (activeData.parentId) {
        const activeParent = findBlock(page.layers, activeData.parentId);
        if (activeParent) {
          activeParentChildren = getBlockChildren(activeParent.block);
          activeParentFullChildIds = activeParentChildren.map(
            (child) => child.id
          );
        }
      }

      const resolved = resolveBlockDragEnd({
        active: activeData,
        over: overData,
        draft,
        activeParentFullChildIds,
        activeParentChildren,
        wouldCreateCycle,
        targetParentAcceptsChildren,
        targetParentLocked,
      });
      if (!resolved) {
        return;
      }

      void executeCommand('html.moveBlock', {
        id: activeData.blockId,
        newParentId: resolved.parentId,
        index: resolved.index,
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
      sensors={sensors}
      onDragCancel={clearDrag}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
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
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeLayer ? (
          <BlockDragOverlayPreview layer={activeLayer} registry={registry} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
});
