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
import type { EditorPaneHostProps } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import {
  applyHtmlDragEnd,
  applyHtmlDragOver,
  applyHtmlDragStart,
  blockCollisionDetection,
  BlockTreeRenderer,
  getPageRootId,
  alignDataPathFromHtmlPath,
  resolveStageClickAction,
  useHtmlPreviewChrome,
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
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
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
import {
  EmailEditorModeServiceId,
  type EmailEditorMode,
} from './email-editor-mode-service';
import { EmailHtmlPreview } from './email-html-preview';
import { EmailHtmlSourceEditor } from './email-html-source-editor';

import styles from './email-editor-pane.module.css';

export { EMAIL_FRAME_WIDTH } from './email-device-preview';

/** Slim desktop chrome — content fills most of the frame with a bit of body around it. */
const DEFAULT_EMAIL_DEVICE_PRESET: HtmlDevicePreset = 'desktop';

function useEmailEditorMode(): EmailEditorMode {
  const { api } = useWorkbenchContext();
  const service = api.getService(EmailEditorModeServiceId);
  const keys = api.getService(ContextKeyServiceId);
  const serviceRef = useRef(service);
  const keysRef = useRef(keys);
  serviceRef.current = service;
  keysRef.current = keys;

  const subscribe = useCallback((onStoreChange: () => void) => {
    const instance = serviceRef.current;
    if (!instance) {
      return () => {};
    }
    instance.bindContextKeys(keysRef.current ?? null);
    instance.setActive(true);
    const sub = instance.onDidChange(() => onStoreChange());
    return () => {
      sub.dispose();
      instance.setActive(false);
    };
  }, []);

  const getSnapshot = useCallback(
    (): EmailEditorMode => serviceRef.current?.getMode() ?? 'edit',
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => 'edit');
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
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const mode = useEmailEditorMode();

  useEffect(() => {
    ensureEmailDocumentFont();
  }, []);

  const {
    artboardRef,
    frameWidth,
    preset,
    scaledHeight,
    scaledWidth,
    stageRef,
    zoom,
  } = useHtmlPreviewChrome({
    initialPreset: DEFAULT_EMAIL_DEVICE_PRESET,
    resolveFrameWidth: resolveEmailFrameWidth,
  });

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
        artboardTestId: 'email-artboard',
        page,
        rootType: 'email.root',
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

  const activePageId = selection?.activePageId ?? null;
  const isPreview = mode === 'preview';
  const isHtml = mode === 'html';
  const isReadOnly = isPreview || isHtml;
  const needsRenderedHtml = isPreview || isHtml;

  useEffect(() => {
    if (!isReadOnly) {
      setPreviewHtml(null);
      setPreviewError(null);
    }
  }, [isReadOnly]);

  useEffect(() => {
    if (isReadOnly && editingTarget) {
      api
        .getService(ContextKeyServiceId)
        ?.setContext('editor.editingText', false);
      setEditingTarget(null);
      clearDrag();
    }
  }, [api, clearDrag, editingTarget, isReadOnly]);

  useEffect(() => {
    if (!needsRenderedHtml || !scene || !activePageId) {
      return;
    }
    let cancelled = false;
    const page = getActivePage(scene, activePageId);
    void renderEmailDocument(page, registry, { pretty: isHtml })
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
  }, [activePageId, isHtml, needsRenderedHtml, registry, scene]);

  if (!(scene && selection)) {
    return null;
  }

  if (isHtml) {
    return (
      <div className={styles.pane}>
        <div aria-label="Email HTML" className={styles.htmlPane} role="region">
          {previewError ? (
            <p className={styles.empty}>{previewError}</p>
          ) : !previewHtml ? (
            <p className={styles.empty}>Rendering HTML…</p>
          ) : (
            <EmailHtmlSourceEditor sourceHtml={previewHtml} />
          )}
        </div>
      </div>
    );
  }

  const page = getActivePage(scene, selection.activePageId);
  const selectedId =
    selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
  const rootId = getPageRootId(page, 'email.root');

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
      onClick={handleStageClick}
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
