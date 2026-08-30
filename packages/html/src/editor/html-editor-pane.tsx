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
import {
  AssetServiceId,
  ContextKeyServiceId,
  getActivePage,
  RichTextInsertServiceId,
} from '@openenvx/core';
import type { EditorPaneHostProps } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
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
import { resolveStageClickAction } from './resolve-stage-click-selection';
import {
  alignDataPathFromHtmlPath,
  type RichTextAlign,
} from './rich-text-align';
import { useHtmlPreviewChrome } from './use-html-preview-chrome';
import { useVariableChipLabels } from './use-variable-chip-labels';

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
  const assets = api.getService(AssetServiceId);
  const canReplaceImage = typeof assets?.upload === 'function';
  const [editingTarget, setEditingTarget] = useState<BlockEditTarget | null>(
    null
  );
  const [sortDraft, setSortDraft] = useState<BlockSortDraft | null>(null);
  const sortDraftRef = useRef<BlockSortDraft | null>(null);
  const richTextInsertRef = useRef<((text: string) => void) | null>(null);

  const bindRichTextInsert = useCallback(
    (insert: ((text: string) => void) | null) => {
      richTextInsertRef.current = insert;
    },
    []
  );

  useEffect(() => {
    const service = api.getService(RichTextInsertServiceId);
    if (!service) {
      return;
    }
    service.setHandler((text) => richTextInsertRef.current?.(text));
    return () => service.setHandler(null);
  }, [api]);

  const { missingTip: variableMissingTip } = useVariableChipLabels();

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
  // ponytail: BeforeDragging freezes droppable rects - scroll mid-drag can mis-hit.
  const measuring = useMemo(
    () => ({
      droppable: { strategy: MeasuringStrategy.BeforeDragging },
    }),
    []
  );

  const resolveAssetUrl = useCallback(
    (ref: string) => (assets ? assets.resolveUrl(ref) : ref),
    [assets]
  );

  const handleReplaceImage = useCallback(
    (layerId: string, fieldPath: string, file: File) => {
      if (!assets?.upload) {
        return;
      }
      void assets
        .upload(file)
        .then((ref) => {
          api.updateProperty(layerId, fieldPath, ref);
        })
        .catch(() => {
          // ponytail: v1 silent failure - toast when workbench status API is ready.
        });
    },
    [api, assets]
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

  /**
   * Nested blocks stopPropagation. Clicks that reach the stage are either
   * artboard/page-root chrome → select root, or stage padding → clear.
   */
  const handleStageClick = useCallback(
    (event: MouseEvent) => {
      if (editingTarget || !scene || !selection) {
        return;
      }
      const page = getActivePage(scene, selection.activePageId);
      const action = resolveStageClickAction({
        target: event.target,
        artboardTestId: 'html-artboard',
        page,
      });
      if (action.type === 'select') {
        api.selectLayers([action.layerId]);
        return;
      }
      api.selectLayers([]);
    },
    [api, editingTarget, scene, selection]
  );

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
          onClick={handleStageClick}
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
                  bindRichTextInsert={bindRichTextInsert}
                  canReplaceImage={canReplaceImage}
                  editingTarget={editingTarget}
                  hoveredLayerId={hoveredLayerId}
                  layers={page.layers}
                  onCommitEdit={handleCommitEdit}
                  onDuplicate={handleDuplicate}
                  onHoverLayer={handleHoverLayer}
                  onRemove={handleRemove}
                  onReplaceImage={handleReplaceImage}
                  onSelect={handleSelect}
                  onStartEdit={handleStartEdit}
                  registry={registry}
                  resolveAssetUrl={resolveAssetUrl}
                  scene={scene}
                  selectedId={selectedId}
                  sortDraft={sortDraft}
                  variableMissingTip={variableMissingTip}
                />
              ) : (
                <p className={styles.empty}>No root block on this page.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
});
