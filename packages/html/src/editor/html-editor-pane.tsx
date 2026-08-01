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
} from 'react';

import { defaultBlockRegistry } from '../block-registry';
import { getPageRootId } from '../tree/block-tree';
import { blockCollisionDetection, type BlockSortDraft } from './block-dnd';
import type { BlockEditTarget } from './block-editor-context';
import { BlockTreeRenderer } from './block-tree-renderer';
import {
  clampHtmlZoom,
  DEFAULT_HTML_DEVICE_PRESET,
  resolveAutoZoom,
  resolveFrameWidth,
  resolveScaledFrameWidth,
  stepHtmlZoom,
  type HtmlDevicePreset,
} from './html-device-preview';
import { HtmlDeviceToolbar } from './html-device-toolbar';
import {
  applyHtmlDragEnd,
  applyHtmlDragOver,
  applyHtmlDragStart,
} from './html-editor-drag';
import { useHtmlDeviceStageMetrics } from './use-html-device-stage-metrics';

import styles from './html-editor-pane.module.css';

export const HtmlEditorPane = memo((_props: EditorPaneHostProps) => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry = defaultBlockRegistry;
  const [editingTarget, setEditingTarget] = useState<BlockEditTarget | null>(
    null
  );
  const [sortDraft, setSortDraft] = useState<BlockSortDraft | null>(null);
  const sortDraftRef = useRef<BlockSortDraft | null>(null);
  const [preset, setPreset] = useState<HtmlDevicePreset>(
    DEFAULT_HTML_DEVICE_PRESET
  );
  const [autoZoom, setAutoZoom] = useState(false);
  const [manualZoom, setManualZoom] = useState(1);

  const { artboardRef, artboardHeight, stageRef, stageWidth } =
    useHtmlDeviceStageMetrics(preset);

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

  const frameWidth = useMemo(
    () => resolveFrameWidth(preset, stageWidth),
    [preset, stageWidth]
  );
  const autoZoomValue = useMemo(
    () => resolveAutoZoom(frameWidth, stageWidth),
    [frameWidth, stageWidth]
  );
  const zoom = autoZoom ? autoZoomValue : manualZoom;
  const scaledWidth = resolveScaledFrameWidth(frameWidth, zoom);
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

  const handlePresetChange = useCallback((next: HtmlDevicePreset) => {
    setPreset(next);
    // Stay at 100% when switching devices so the page stays readable.
    setAutoZoom(false);
    setManualZoom(1);
  }, []);

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
        <div className={styles.toolbarHost}>
          <HtmlDeviceToolbar
            autoZoom={autoZoom}
            autoZoomValue={autoZoomValue}
            preset={preset}
            zoom={zoom}
            onPresetChange={handlePresetChange}
            onZoomAuto={handleZoomAuto}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomPercent={handleZoomPercent}
          />
        </div>
        <div
          aria-label="HTML blocks"
          className={styles.stage}
          ref={stageRef}
          role="tree"
          tabIndex={0}
          onClick={clearSelection}
          onKeyDown={handleCanvasKeyDown}
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
          </div>
        </div>
      </div>
    </DndContext>
  );
});
