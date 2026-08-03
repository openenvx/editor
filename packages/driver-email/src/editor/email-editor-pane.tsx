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
  applyHtmlDragEnd,
  applyHtmlDragOver,
  applyHtmlDragStart,
  blockCollisionDetection,
  BlockTreeRenderer,
  clampHtmlZoom,
  getPageRootId,
  HtmlDeviceToolbar,
  alignDataPathFromHtmlPath,
  resolveAutoZoom,
  resolveScaledFrameWidth,
  stepHtmlZoom,
  useHtmlDeviceStageMetrics,
  type BlockRegistry,
  type BlockSortDraft,
  type HtmlDevicePreset,
  type RichTextAlign,
} from '@openenvx/html';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from '../block-registry';
import { ensureEmailDocumentFont } from '../render/email-document-font';
import { renderEmailDocument } from '../render/render-email-document';
import type { BlockEditTarget } from './block-edit-target';
import { resolveEmailFrameWidth } from './email-device-preview';
import { EmailHtmlPreview } from './email-html-preview';

import styles from './email-editor-pane.module.css';

export { EMAIL_FRAME_WIDTH } from './email-device-preview';

/** Slim desktop chrome — content fills most of the frame with a bit of body around it. */
const DEFAULT_EMAIL_DEVICE_PRESET: HtmlDevicePreset = 'desktop';

type EmailPaneMode = 'edit' | 'preview';

function EmailModeToggle({
  isPreview,
  onEdit,
  onPreview,
}: {
  isPreview: boolean;
  onEdit: () => void;
  onPreview: () => void;
}) {
  return (
    <div className={styles.modeToggle} role="group" aria-label="Editor mode">
      <button
        aria-pressed={!isPreview}
        className={[
          styles.modeButton,
          !isPreview ? styles.modeButtonActive : '',
        ]
          .filter(Boolean)
          .join(' ')}
        title="Edit"
        type="button"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        aria-pressed={isPreview}
        className={[styles.modeButton, isPreview ? styles.modeButtonActive : '']
          .filter(Boolean)
          .join(' ')}
        title="Preview"
        type="button"
        onClick={onPreview}
      >
        Preview
      </button>
    </div>
  );
}

export const EmailEditorPane = memo((_props: EditorPaneHostProps) => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const hoveredLayerId = useWorkbenchContextSelector(
    (state) => state.interaction.hoveredLayerId
  );
  const registry: BlockRegistry =
    api.getService(EmailBlockRegistryServiceId) ?? emailBlockRegistry;
  const [editingTarget, setEditingTarget] = useState<BlockEditTarget | null>(
    null
  );
  const [sortDraft, setSortDraft] = useState<BlockSortDraft | null>(null);
  const sortDraftRef = useRef<BlockSortDraft | null>(null);
  const [preset, setPreset] = useState<HtmlDevicePreset>(
    DEFAULT_EMAIL_DEVICE_PRESET
  );
  const [autoZoom, setAutoZoom] = useState(true);
  const [manualZoom, setManualZoom] = useState(1);
  const [mode, setMode] = useState<EmailPaneMode>('edit');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    ensureEmailDocumentFont();
  }, []);

  const { artboardRef, artboardHeight, stageRef, stageWidth } =
    useHtmlDeviceStageMetrics(preset);

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

  const frameWidth = useMemo(
    () => resolveEmailFrameWidth(preset, stageWidth),
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

  const handlePresetChange = useCallback((next: HtmlDevicePreset) => {
    setPreset(next);
    setAutoZoom(true);
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

  const enterEditMode = useCallback(() => {
    setMode('edit');
    setPreviewHtml(null);
    setPreviewError(null);
  }, []);

  const enterPreviewMode = useCallback(() => {
    if (editingTarget) {
      api
        .getService(ContextKeyServiceId)
        ?.setContext('editor.editingText', false);
      setEditingTarget(null);
    }
    clearDrag();
    setMode('preview');
  }, [api, clearDrag, editingTarget]);

  const activePageId = selection?.activePageId ?? null;

  useEffect(() => {
    if (mode !== 'preview' || !scene || !activePageId) {
      return;
    }
    let cancelled = false;
    const page = getActivePage(scene, activePageId);
    void renderEmailDocument(page, registry)
      .then((html) => {
        if (cancelled) {
          return;
        }
        setPreviewHtml(html);
        setPreviewError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setPreviewHtml(null);
        setPreviewError(
          error instanceof Error ? error.message : 'Failed to render email'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [activePageId, mode, registry, scene]);

  if (!(scene && selection)) {
    return null;
  }

  const page = getActivePage(scene, selection.activePageId);
  const selectedId =
    selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
  const rootId = getPageRootId(page, 'email.root');
  const isPreview = mode === 'preview';

  let artboardContent: ReactNode;
  if (!rootId) {
    artboardContent = (
      <p className={styles.empty}>No email.root block on this page.</p>
    );
  } else if (isPreview) {
    if (previewError) {
      artboardContent = <p className={styles.empty}>{previewError}</p>;
    } else if (!previewHtml) {
      artboardContent = <p className={styles.empty}>Rendering preview…</p>;
    } else {
      artboardContent = <EmailHtmlPreview html={previewHtml} />;
    }
  } else {
    artboardContent = (
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
    );
  }

  const artboard = (
    <div
      className={styles.artboardSlot}
      data-device={preset}
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
          width: frameWidth > 0 ? frameWidth : undefined,
          transform: `scale(${zoom})`,
        }}
      >
        {artboardContent}
      </div>
    </div>
  );

  const stage = isPreview ? (
    <div
      aria-label="Email preview"
      className={styles.stage}
      ref={stageRef}
      role="region"
    >
      {artboard}
    </div>
  ) : (
    <div
      aria-label="Email blocks"
      className={styles.stage}
      ref={stageRef}
      role="tree"
      tabIndex={0}
      onClick={clearSelection}
      onKeyDown={handleCanvasKeyDown}
      onPointerLeave={() => api.setHoveredLayer(null)}
    >
      {artboard}
    </div>
  );

  const pane = (
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
          trailing={
            <EmailModeToggle
              isPreview={isPreview}
              onEdit={enterEditMode}
              onPreview={enterPreviewMode}
            />
          }
          zoom={zoom}
          onPresetChange={handlePresetChange}
          onZoomAuto={handleZoomAuto}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomPercent={handleZoomPercent}
        />
      </div>
      {stage}
    </div>
  );

  if (isPreview) {
    return pane;
  }

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
      {pane}
    </DndContext>
  );
});
