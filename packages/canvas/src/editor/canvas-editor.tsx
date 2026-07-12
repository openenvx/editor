import type { EditorViewportApi } from '@openenvx/core';
import { isLayerEditable, isLayerWritable } from '@openenvx/core';
import type { Page } from '@openenvx/schema';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCanvasHost } from '../canvas-host-context';
import { CanvasStage } from '../canvas-stage';
import type {
  CanvasSelectLayerOptions,
  CanvasTransformChange,
} from '../canvas-stage';
import { captureClipboardDataTransferSync } from '../clipboard/read-external-clipboard';
import { collectCanvasFontFamilies } from '../collect-canvas-font-families';
import { useCanvasClipboardService } from '../hooks/use-canvas-clipboard-service';
import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import {
  computePageSafeBounds,
  defaultShowMarginsForPage,
} from '../page-margins';
import type {
  CanvasLayerInteractionRegistration,
  CanvasLayerRendererRegistration,
} from '../registry/canvas-registry-types';
import type { CanvasStageInteractionService } from '../stage/canvas-stage-interaction';
import { useCanvasFontPreload } from '../use-canvas-font-preload';
import { useContainerSize } from '../use-container-size';
import { ViewportController } from '../viewport';
import { CanvasRichTextOverlay } from './canvas-rich-text-overlay';

import styles from './canvas-editor.module.css';

function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]')
  );
}

export interface CanvasEditorProps {
  layerSurface: CanvasLayerSurfaceItem[];
  artboardWidth: number;
  artboardHeight: number;
  page: Page;
  selectedLayerIds: string[];
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  stageInteraction?: CanvasStageInteractionService | null;
  onSelectLayer: (layerId: string, options?: CanvasSelectLayerOptions) => void;
  onTransformChange: (layerId: string, change: CanvasTransformChange) => void;
  onPropertyChange: (layerId: string, key: string, value: unknown) => void;
  onExecuteCommand?: (commandId: string) => Promise<boolean>;
  onZoomChange?: (zoomPercent: number) => void;
  onContainerResize?: (size: { width: number; height: number }) => void;
  onViewportApiReady?: (api: EditorViewportApi | null) => void;
}

function createViewportApi(
  viewport: ViewportController,
  getContainerSize: () => { width: number; height: number },
  artboardWidth: number,
  artboardHeight: number,
  notifyZoom: (zoom: number) => void
): EditorViewportApi {
  return {
    getZoomPercent: () => Math.round(viewport.getViewport().zoom * 100),
    reset: () => {
      viewport.reset();
      notifyZoom(viewport.getViewport().zoom);
    },
    zoomIn: () => {
      viewport.setZoom(viewport.getViewport().zoom + 0.1);
      notifyZoom(viewport.getViewport().zoom);
    },
    zoomOut: () => {
      viewport.setZoom(viewport.getViewport().zoom - 0.1);
      notifyZoom(viewport.getViewport().zoom);
    },
    zoomTo100: () => {
      viewport.setZoom(1);
      notifyZoom(1);
    },
    zoomToFit: () => {
      const size = getContainerSize();
      if (size.width <= 0 || size.height <= 0) {
        return;
      }
      viewport.zoomToFit(
        size.width,
        size.height,
        artboardWidth,
        artboardHeight
      );
      notifyZoom(viewport.getViewport().zoom);
    },
  };
}

export const CanvasEditor = memo(
  ({
    layerSurface,
    artboardWidth,
    artboardHeight,
    page,
    selectedLayerIds,
    canvasLayerRenderers,
    canvasLayerInteractions,
    stageInteraction,
    onSelectLayer,
    onTransformChange,
    onPropertyChange,
    onExecuteCommand,
    onZoomChange,
    onContainerResize,
    onViewportApiReady,
  }: CanvasEditorProps) => {
    const canvasClipboardService = useCanvasClipboardService();
    const host = useCanvasHost();
    const [containerRef, containerSize] = useContainerSize<HTMLDivElement>();
    const viewportRef = useRef<ViewportController | null>(null);
    const containerSizeRef = useRef(containerSize);
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [showMargins, setShowMargins] = useState(() =>
      defaultShowMarginsForPage(page)
    );
    const [, setViewportTick] = useState(0);

    const pageMarginBounds = useMemo(() => computePageSafeBounds(page), [page]);

    containerSizeRef.current = containerSize;

    if (!viewportRef.current) {
      viewportRef.current = new ViewportController();
    }
    const viewport = viewportRef.current;

    const handleViewportChange = useCallback(
      (zoom: number) => {
        onZoomChange?.(Math.round(zoom * 100));
        setViewportTick((value) => value + 1);
      },
      [onZoomChange]
    );

    const fitApplied = useRef(false);
    const prevArtboardRef = useRef({
      height: artboardHeight,
      width: artboardWidth,
    });

    useEffect(() => {
      onContainerResize?.(containerSize);
      if (
        !fitApplied.current &&
        containerSize.width > 0 &&
        containerSize.height > 0
      ) {
        viewport.zoomToFit(
          containerSize.width,
          containerSize.height,
          artboardWidth,
          artboardHeight
        );
        fitApplied.current = true;
        prevArtboardRef.current = {
          height: artboardHeight,
          width: artboardWidth,
        };
        handleViewportChange(viewport.getViewport().zoom);
      }
    }, [
      artboardHeight,
      artboardWidth,
      containerSize,
      handleViewportChange,
      onContainerResize,
      viewport,
    ]);

    useEffect(() => {
      if (containerSize.width <= 0 || containerSize.height <= 0) {
        return;
      }

      const prev = prevArtboardRef.current;
      const dimensionsChanged =
        prev.width !== artboardWidth || prev.height !== artboardHeight;

      if (!dimensionsChanged) {
        return;
      }

      if (fitApplied.current) {
        viewport.adjustZoomForPageResize(
          prev.width,
          prev.height,
          artboardWidth,
          artboardHeight,
          containerSize.width,
          containerSize.height
        );
        handleViewportChange(viewport.getViewport().zoom);
      }

      prevArtboardRef.current = {
        height: artboardHeight,
        width: artboardWidth,
      };
    }, [
      artboardHeight,
      artboardWidth,
      containerSize.height,
      containerSize.width,
      handleViewportChange,
      viewport,
    ]);

    useEffect(() => {
      if (!onViewportApiReady) {
        return;
      }
      const apiInstance = createViewportApi(
        viewport,
        () => containerSizeRef.current,
        artboardWidth,
        artboardHeight,
        handleViewportChange
      );
      onViewportApiReady(apiInstance);
      return () => onViewportApiReady(null);
    }, [
      artboardHeight,
      artboardWidth,
      handleViewportChange,
      onViewportApiReady,
      viewport,
    ]);

    const overlayLayers = useMemo(
      () =>
        layerSurface.flatMap((item) => {
          const interaction = canvasLayerInteractions.find(
            (entry) => entry.kind === item.view.kind
          );
          return interaction?.usesEditOverlay
            ? [{ layer: item.layer, view: item.view }]
            : [];
        }),
      [canvasLayerInteractions, layerSurface]
    );

    const fontFamilies = useMemo(
      () => collectCanvasFontFamilies(layerSurface),
      [layerSurface]
    );
    const fontLoadRevision = useCanvasFontPreload(fontFamilies);

    const viewportState = viewport.getViewport();

    useEffect(() => {
      canvasClipboardService.setPointerContext({
        artboardHeight,
        artboardWidth,
        containerHeight: containerSize.height,
        containerWidth: containerSize.width,
        panX: viewportState.panX,
        panY: viewportState.panY,
        zoom: viewportState.zoom,
      });
    }, [
      artboardHeight,
      artboardWidth,
      canvasClipboardService,
      containerSize.height,
      containerSize.width,
      viewportState.panX,
      viewportState.panY,
      viewportState.zoom,
    ]);

    const syncFocusedContext = useCallback(
      (focused: boolean) => {
        canvasClipboardService.setFocused(focused);
        host.setContextKey('canvas.focused', focused);
      },
      [host, canvasClipboardService]
    );

    useEffect(() => {
      host.setContextKey('canvas.editingText', editingLayerId !== null);
    }, [host, editingLayerId]);

    useEffect(() => {
      canvasClipboardService.setEditingText(editingLayerId !== null);
    }, [canvasClipboardService, editingLayerId]);

    useEffect(() => {
      canvasClipboardService.setEditorActive(true);
      host.setContextKey('canvas.focused', false);
      return () => {
        canvasClipboardService.setEditorActive(false);
        host.setContextKey('canvas.focused', false);
        host.setContextKey('canvas.editingText', false);
      };
    }, [host, canvasClipboardService]);

    useEffect(() => {
      canvasClipboardService.setStageHost(containerRef.current);
      return () => canvasClipboardService.setStageHost(null);
    }, [canvasClipboardService, containerRef]);

    const handleStageMouseDown = useCallback(() => {
      syncFocusedContext(true);
      containerRef.current?.focus({ preventScroll: true });
    }, [containerRef, syncFocusedContext]);

    const handleStageMouseEnter = useCallback(() => {
      syncFocusedContext(true);
      containerRef.current?.focus({ preventScroll: true });
    }, [containerRef, syncFocusedContext]);

    const handleStageMouseLeave = useCallback(() => {
      syncFocusedContext(false);
    }, [syncFocusedContext]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const onMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        canvasClipboardService.setLastPointer({
          screenX: event.clientX - rect.left,
          screenY: event.clientY - rect.top,
        });
      };

      container.addEventListener('mousedown', handleStageMouseDown);
      container.addEventListener('mouseenter', handleStageMouseEnter);
      container.addEventListener('mouseleave', handleStageMouseLeave);
      container.addEventListener('mousemove', onMouseMove);

      return () => {
        container.removeEventListener('mousedown', handleStageMouseDown);
        container.removeEventListener('mouseenter', handleStageMouseEnter);
        container.removeEventListener('mouseleave', handleStageMouseLeave);
        container.removeEventListener('mousemove', onMouseMove);
      };
    }, [
      canvasClipboardService,
      containerRef,
      handleStageMouseDown,
      handleStageMouseEnter,
      handleStageMouseLeave,
    ]);

    const handleCanvasPaste = useCallback(
      async (event: ClipboardEvent) => {
        if (!canvasClipboardService.isEditorActive()) {
          return;
        }
        if (canvasClipboardService.isEditingText()) {
          return;
        }
        if (isEditablePasteTarget(event.target)) {
          return;
        }
        if (canvasClipboardService.consumeSkipNextPasteEvent()) {
          event.preventDefault();
          return;
        }

        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return;
        }

        const hasInternal = canvasClipboardService.hasInternal();
        const captured = captureClipboardDataTransferSync(clipboardData);
        if (!hasInternal && !captured) {
          return;
        }

        event.preventDefault();
        canvasClipboardService.setPendingCapturedPayload(captured);
        await onExecuteCommand?.('canvas.pasteExternal');
        canvasClipboardService.setPendingCapturedPayload(null);
      },
      [canvasClipboardService, onExecuteCommand]
    );

    useEffect(() => {
      document.addEventListener('paste', handleCanvasPaste);
      return () => document.removeEventListener('paste', handleCanvasPaste);
    }, [handleCanvasPaste]);

    useEffect(() => {
      if (
        editingLayerId &&
        !overlayLayers.some(({ layer }) => layer.id === editingLayerId)
      ) {
        setEditingLayerId(null);
      }
    }, [editingLayerId, overlayLayers]);

    const handleCommitEdit = useCallback(
      (layerId: string, html: string) => {
        const selectedLayer = layerSurface.find(
          (item) => item.layer.id === layerId
        )?.layer;
        if (selectedLayer && !isLayerWritable(selectedLayer)) {
          setEditingLayerId(null);
          return;
        }
        onPropertyChange(layerId, 'html', html);
        setEditingLayerId(null);
      },
      [onPropertyChange, layerSurface]
    );

    return (
      <div className={styles.host}>
        <div
          className={styles.stageHost}
          ref={containerRef}
          role="application"
          tabIndex={-1}
        >
          {pageMarginBounds ? (
            <button
              aria-pressed={showMargins}
              className={
                showMargins ? styles.marginToggleActive : styles.marginToggle
              }
              onClick={() => setShowMargins((current) => !current)}
              type="button"
            >
              Margins
            </button>
          ) : null}
          <CanvasStage
            artboardHeight={artboardHeight}
            artboardWidth={artboardWidth}
            canvasLayerInteractions={canvasLayerInteractions}
            canvasLayerRenderers={canvasLayerRenderers}
            stageInteraction={stageInteraction}
            containerHeight={containerSize.height}
            containerWidth={containerSize.width}
            editingLayerId={editingLayerId}
            fontLoadRevision={fontLoadRevision}
            layers={layerSurface}
            onLayerDoubleClick={(layerId) => {
              const selectedLayer = layerSurface.find(
                (item) => item.layer.id === layerId
              )?.layer;
              if (selectedLayer && !isLayerWritable(selectedLayer)) {
                return;
              }
              setEditingLayerId(layerId);
            }}
            onSelectLayer={(layerId, options) => {
              if (!layerId) {
                setEditingLayerId(null);
                onSelectLayer('');
                return;
              }
              const selectedLayer = layerSurface.find(
                (item) => item.layer.id === layerId
              )?.layer;
              if (selectedLayer && !isLayerEditable(selectedLayer)) {
                return;
              }
              if (editingLayerId && layerId !== editingLayerId) {
                setEditingLayerId(null);
              }
              onSelectLayer(layerId, options);
            }}
            onTransformChange={onTransformChange}
            onViewportChange={handleViewportChange}
            pageMarginBounds={pageMarginBounds}
            selectedLayerIds={selectedLayerIds}
            showMargins={showMargins}
            viewportController={viewport}
          />
          <CanvasRichTextOverlay
            artboardHeight={artboardHeight}
            artboardWidth={artboardWidth}
            canvasLayerInteractions={canvasLayerInteractions}
            containerHeight={containerSize.height}
            containerWidth={containerSize.width}
            editingLayerId={editingLayerId}
            layers={overlayLayers}
            onCommitEdit={handleCommitEdit}
            viewport={viewportState}
          />
        </div>
      </div>
    );
  }
);

export function useCanvasViewport(): ViewportController {
  const ref = useRef<ViewportController | null>(null);
  if (!ref.current) {
    ref.current = new ViewportController();
  }
  return ref.current;
}
