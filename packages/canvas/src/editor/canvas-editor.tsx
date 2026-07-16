import type { EditorViewportApi } from '@openenvx/core';
import { canEditLayerData, canSelectLayer } from '@openenvx/core';
import type { Page } from '@openenvx/schema';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCanvasHost } from '../canvas-host-context';
import { CanvasGridSettingsServiceId } from '../canvas-service-tokens';
import { CanvasStage } from '../canvas-stage';
import type {
  CanvasSelectLayerOptions,
  CanvasTransformChange,
} from '../canvas-stage';
import { captureClipboardDataTransferSync } from '../clipboard/read-external-clipboard';
import { collectCanvasFontFamilies } from '../collect-canvas-font-families';
import {
  flattenLayerSurface,
  findLayerSurfaceItem,
} from '../flatten-layer-surface';
import {
  DEFAULT_CANVAS_GRID_SIZE,
  type CanvasGridSettingsSnapshot,
} from '../grid/canvas-grid-settings';
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
  primaryLayerId?: string | null;
  hoveredLayerId?: string | null;
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  stageInteraction?: CanvasStageInteractionService | null;
  onSelectLayer: (layerId: string, options?: CanvasSelectLayerOptions) => void;
  onHoverLayer?: (layerId: string | null) => void;
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
    primaryLayerId = null,
    hoveredLayerId = null,
    canvasLayerRenderers,
    canvasLayerInteractions,
    stageInteraction,
    onSelectLayer,
    onHoverLayer,
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
    const [gridSettings, setGridSettings] =
      useState<CanvasGridSettingsSnapshot>(() => ({
        enabled: false,
        size: DEFAULT_CANVAS_GRID_SIZE,
      }));
    const [, setViewportTick] = useState(0);

    const pageMarginBounds = useMemo(() => computePageSafeBounds(page), [page]);
    const gridService = host.getService(CanvasGridSettingsServiceId);

    useEffect(() => {
      if (!gridService) {
        return;
      }
      setGridSettings(gridService.getSnapshot());
      return gridService.subscribe(setGridSettings);
    }, [gridService]);

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

    const flatLayerSurface = useMemo(
      () => flattenLayerSurface(layerSurface),
      [layerSurface]
    );

    const overlayLayers = useMemo(
      () =>
        flatLayerSurface.flatMap((item) => {
          const interaction = canvasLayerInteractions.find(
            (entry) => entry.kind === item.view.kind
          );
          return interaction?.usesEditOverlay
            ? [{ layer: item.layer, view: item.view }]
            : [];
        }),
      [canvasLayerInteractions, flatLayerSurface]
    );

    const fontFamilies = useMemo(
      () => collectCanvasFontFamilies(flatLayerSurface),
      [flatLayerSurface]
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
        const selectedLayer = findLayerSurfaceItem(
          layerSurface,
          layerId
        )?.layer;
        if (selectedLayer && !canEditLayerData(selectedLayer)) {
          setEditingLayerId(null);
          return;
        }
        onPropertyChange(layerId, 'html', html);
        setEditingLayerId(null);
      },
      [onPropertyChange, layerSurface]
    );

    const handleLayerDoubleClick = useCallback(
      (layerId: string) => {
        const selectedLayer = findLayerSurfaceItem(
          layerSurface,
          layerId
        )?.layer;
        if (selectedLayer && !canEditLayerData(selectedLayer)) {
          return;
        }
        setEditingLayerId(layerId);
      },
      [layerSurface]
    );

    const handleSelectLayer = useCallback(
      (layerId: string, options?: CanvasSelectLayerOptions) => {
        if (!layerId) {
          setEditingLayerId(null);
          onSelectLayer('');
          return;
        }
        const selectedLayer = findLayerSurfaceItem(
          layerSurface,
          layerId
        )?.layer;
        if (selectedLayer && !canSelectLayer(selectedLayer)) {
          return;
        }
        if (editingLayerId && layerId !== editingLayerId) {
          setEditingLayerId(null);
        }
        onSelectLayer(layerId, options);
      },
      [editingLayerId, layerSurface, onSelectLayer]
    );

    return (
      <div className={styles.host}>
        <div
          className={styles.stageHost}
          ref={containerRef}
          role="application"
          tabIndex={-1}
        >
          {gridService || pageMarginBounds ? (
            <div className={styles.chromeToggles}>
              {gridService ? (
                <button
                  aria-pressed={gridSettings.enabled}
                  className={
                    gridSettings.enabled
                      ? styles.chromeToggleActive
                      : styles.chromeToggle
                  }
                  onClick={() => {
                    void host.executeCommand('canvas.toggleGrid');
                  }}
                  type="button"
                >
                  Grid
                </button>
              ) : null}
              {pageMarginBounds ? (
                <button
                  aria-pressed={showMargins}
                  className={
                    showMargins
                      ? styles.marginToggleActive
                      : styles.marginToggle
                  }
                  onClick={() => setShowMargins((current) => !current)}
                  type="button"
                >
                  Margins
                </button>
              ) : null}
            </div>
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
            gridSize={gridSettings.size}
            hoveredLayerId={hoveredLayerId}
            layers={layerSurface}
            onHoverLayer={onHoverLayer}
            onLayerDoubleClick={handleLayerDoubleClick}
            onSelectLayer={handleSelectLayer}
            onTransformChange={onTransformChange}
            onViewportChange={handleViewportChange}
            pageMarginBounds={pageMarginBounds}
            primaryLayerId={primaryLayerId}
            selectedLayerIds={selectedLayerIds}
            showGrid={gridSettings.enabled}
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
