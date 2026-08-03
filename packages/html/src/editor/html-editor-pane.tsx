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
import { ContextKeyServiceId, getActivePage } from '@openenvx/core';
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
} from 'react';

import {
  BlockRegistryServiceId,
  defaultBlockRegistry,
  type BlockRegistry,
} from '../block-registry';
import { getPageRootId } from '../tree/block-tree';
import { blockCollisionDetection, type BlockSortDraft } from './block-dnd';
import type { BlockEditTarget } from './block-editor-context';
import { BlockTreeRenderer } from './block-tree-renderer';
import {
  applyHtmlDragEnd,
  applyHtmlDragOver,
  applyHtmlDragStart,
} from './html-editor-drag';
import {
  alignDataPathFromHtmlPath,
  type RichTextAlign,
} from './rich-text-align';
import { useHtmlPreviewChrome } from './use-html-preview-chrome';

import styles from './html-editor-pane.module.css';

export const HtmlEditorPane = memo((_props: EditorPaneHostProps) => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const hoveredLayerId = useWorkbenchContextSelector(
    (state) => state.interaction.hoveredLayerId
  );
  const registry: BlockRegistry =
    api.getService(BlockRegistryServiceId) ?? defaultBlockRegistry;
  const [editingTarget, setEditingTarget] = useState<BlockEditTarget | null>(
    null
  );
  const [sortDraft, setSortDraft] = useState<BlockSortDraft | null>(null);
  const sortDraftRef = useRef<BlockSortDraft | null>(null);

  const {
    artboardHeight: _artboardHeight,
    artboardRef,
    frameWidth,
    preset,
    scaledHeight,
    scaledWidth,
    stageRef,
    zoom,
  } = useHtmlPreviewChrome();

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

  const handleHoverLayer = useCallback(
    (id: string | null) => {
      api.setHoveredLayer(id);
    },
    [api]
  );

  const clearSelection = useCallback(() => {
    if (editingTarget) {
      return;
    }
    api.selectLayers([]);
  }, [api, editingTarget]);

  const handleStartEdit = useCallback(
    (hostId: string, dataPath: string) => {
      api
        .getService(ContextKeyServiceId)
        ?.setContext('editor.editingText', true);
      setEditingTarget({ hostId, dataPath });
    },
    [api]
  );

  const handleCommitEdit = useCallback(
    (hostId: string, dataPath: string, html: string, align?: RichTextAlign) => {
      if (align !== undefined) {
        api.updateProperties(hostId, {
          [dataPath]: html,
          [alignDataPathFromHtmlPath(dataPath)]: align,
        });
      } else {
        api.updateProperty(hostId, dataPath, html);
      }
      api
        .getService(ContextKeyServiceId)
        ?.setContext('editor.editingText', false);
      setEditingTarget(null);
    },
    [api]
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

  const handleCanvasKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (editingTarget) {
        return;
      }
      event.preventDefault();
      clearSelection();
    },
    [clearSelection, editingTarget]
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
        className={[styles.pane, sortDraft ? styles.paneDragging : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div
          aria-label="HTML blocks"
          className={styles.stage}
          ref={stageRef}
          role="tree"
          tabIndex={0}
          onClick={clearSelection}
          onKeyDown={handleCanvasKeyDown}
          onPointerLeave={() => api.setHoveredLayer(null)}
        >
          <div
            className={styles.artboardSlot}
            data-device={preset}
            data-testid="html-artboard"
            style={{
              width: scaledWidth > 0 ? scaledWidth : undefined,
              height: scaledHeight,
            }}
          >
            <div
              className={styles.artboard}
              ref={artboardRef}
              style={{
                width: frameWidth > 0 ? frameWidth : undefined,
                transform: `scale(${zoom})`,
              }}
            >
              {rootId ? (
                <BlockTreeRenderer
                  editingTarget={editingTarget}
                  hoveredLayerId={hoveredLayerId}
                  layers={page.layers}
                  onCommitEdit={handleCommitEdit}
                  onDuplicate={handleDuplicate}
                  onHoverLayer={handleHoverLayer}
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
          </div>
        </div>
      </div>
    </DndContext>
  );
});
