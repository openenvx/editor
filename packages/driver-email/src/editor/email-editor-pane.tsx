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
  applyHtmlDragEnd,
  applyHtmlDragOver,
  applyHtmlDragStart,
  blockCollisionDetection,
  BlockTreeRenderer,
  clampHtmlZoom,
  getPageRootId,
  resolveAutoZoom,
  resolveScaledFrameWidth,
  stepHtmlZoom,
  type BlockRegistry,
  type BlockSortDraft,
} from '@openenvx/html';
import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from '../block-registry';
import type { BlockEditTarget } from './block-edit-target';
import { useEmailStageMetrics } from './use-email-stage-metrics';

import styles from './email-editor-pane.module.css';

/** Standard email content width (px). */
export const EMAIL_FRAME_WIDTH = 600;

export const EmailEditorPane = memo((_props: EditorPaneHostProps) => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry: BlockRegistry =
    api.getService(EmailBlockRegistryServiceId) ?? emailBlockRegistry;
  const [editingTarget, setEditingTarget] = useState<BlockEditTarget | null>(
    null
  );
  const [sortDraft, setSortDraft] = useState<BlockSortDraft | null>(null);
  const sortDraftRef = useRef<BlockSortDraft | null>(null);
  const [autoZoom, setAutoZoom] = useState(true);
  const [manualZoom, setManualZoom] = useState(1);

  const { artboardRef, artboardHeight, stageRef, stageWidth } =
    useEmailStageMetrics();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  // ponytail: BeforeDragging freezes droppable rects — scroll mid-drag can mis-hit.
  const measuring = useMemo(
    () => ({
      droppable: { strategy: MeasuringStrategy.BeforeDragging },
    }),
    []
  );

  const autoZoomValue = useMemo(
    () => resolveAutoZoom(EMAIL_FRAME_WIDTH, stageWidth),
    [stageWidth]
  );
  const zoom = autoZoom ? autoZoomValue : manualZoom;
  const scaledWidth = resolveScaledFrameWidth(EMAIL_FRAME_WIDTH, zoom);
  const scaledHeight = artboardHeight > 0 ? artboardHeight * zoom : undefined;

  const handleSelect = useCallback(
    (id: string) => {
      api.selectLayers([id]);
    },
    [api]
  );

  const clearSelection = useCallback(() => {
    if (editingTarget) {
      return;
    }
    api.selectLayers([]);
  }, [api, editingTarget]);

  const handleStartEdit = useCallback((hostId: string, dataPath: string) => {
    setEditingTarget({ hostId, dataPath });
  }, []);

  const handleCommitEdit = useCallback(
    (hostId: string, dataPath: string, html: string) => {
      api.updateProperty(hostId, dataPath, html);
      setEditingTarget(null);
    },
    [api]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      void executeCommand('email.duplicateBlock', { id });
    },
    [executeCommand]
  );

  const handleRemove = useCallback(
    (id: string) => {
      void executeCommand('email.removeBlock', { id });
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
        moveCommandId: 'email.moveBlock',
        executeCommand: (commandId, commandArgs) => {
          void executeCommand(commandId, commandArgs);
        },
      });
    },
    [clearDrag, executeCommand, registry, scene, selection]
  );

  const handleZoomIn = useCallback(() => {
    setAutoZoom(false);
    setManualZoom((previous) =>
      stepHtmlZoom(autoZoom ? autoZoomValue : previous, 1)
    );
  }, [autoZoom, autoZoomValue]);

  const handleZoomOut = useCallback(() => {
    setAutoZoom(false);
    setManualZoom((previous) =>
      stepHtmlZoom(autoZoom ? autoZoomValue : previous, -1)
    );
  }, [autoZoom, autoZoomValue]);

  const handleZoomAuto = useCallback(() => {
    setAutoZoom(true);
  }, []);

  const handleZoomPercent = useCallback((next: number) => {
    setAutoZoom(false);
    setManualZoom(clampHtmlZoom(next));
  }, []);

  if (!(scene && selection)) {
    return null;
  }

  const page = getActivePage(scene, selection.activePageId);
  const selectedId =
    selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
  const rootId = getPageRootId(page, 'email.root');

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
        <div className={styles.toolbarHost}>
          <div className={styles.emailZoomBar} role="toolbar">
            <button onClick={handleZoomOut} type="button">
              −
            </button>
            <button onClick={handleZoomAuto} type="button">
              {autoZoom
                ? `${Math.round(zoom * 100)}% Auto`
                : `${Math.round(zoom * 100)}%`}
            </button>
            <button onClick={handleZoomIn} type="button">
              +
            </button>
            <button onClick={() => handleZoomPercent(1)} type="button">
              100%
            </button>
          </div>
        </div>
        <div
          aria-label="Email blocks"
          className={styles.stage}
          ref={stageRef}
          role="tree"
          tabIndex={0}
          onClick={clearSelection}
          onKeyDown={handleCanvasKeyDown}
        >
          <div
            className={styles.artboardSlot}
            data-testid="email-artboard"
            style={{
              width: scaledWidth > 0 ? scaledWidth : undefined,
              height: scaledHeight,
            }}
          >
            <div
              className={styles.artboard}
              ref={artboardRef}
              style={{
                width: EMAIL_FRAME_WIDTH,
                transform: `scale(${zoom})`,
              }}
            >
              {rootId ? (
                <BlockTreeRenderer
                  editingTarget={editingTarget}
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
                <p className={styles.empty}>
                  No email.root block on this page.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
});
