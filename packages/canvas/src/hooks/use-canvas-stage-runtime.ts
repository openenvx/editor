import type { Layer as SceneLayer } from '@openenvx/core';
import { canTransformLayer, getLayerChildren } from '@openenvx/core';
import { useStoreSelector } from '@openenvx/headless/react';
import type Konva from 'konva';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';

import type { CanvasStageProps, SelectionBounds } from '../canvas-stage-types';
import { getInteraction } from '../canvas-transformer-utils';
import { flattenStageLayers } from '../flatten-layer-surface';
import { CANVAS_GROUP_LAYER_TYPE } from '../layers/canvas-group-layer';
import { userGuidesToSnapAxes } from '../rulers/ruler-math';
import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';
import type {
  CanvasLayerTransformRef,
  CanvasRect,
  CanvasStageInteractionService,
} from '../stage/canvas-stage-interaction';
import {
  createCanvasStageRuntime,
  type CanvasStageRuntime,
} from '../stage/canvas-stage-runtime';
import {
  selectActiveDragAnchor,
  selectActiveHandleAnchor,
  selectInteractionPreviewLayerId,
  selectTransformSessionLayerId,
} from '../stage/canvas-stage-selectors';
import type { ViewportController } from '../viewport';
import { useCanvasDragSnap } from './use-canvas-drag-snap';
import { useCanvasHover } from './use-canvas-hover';
import { useCanvasOverlays } from './use-canvas-overlays';
import { useCanvasStageViewport } from './use-canvas-stage-viewport';
import { useHandleDragSession } from './use-handle-drag-session';
import { useLayerTransformSession } from './use-layer-transform-session';
import { useSelectionLabel } from './use-selection-label';
import { useTransformModifiers } from './use-transform-modifiers';
import { useTransformerAttachment } from './use-transformer-attachment';

export interface CanvasStageShell {
  stageContainerRef: RefObject<HTMLDivElement | null>;
  runtime: CanvasStageRuntime;
  viewport: ViewportController;
  vp: ReturnType<ViewportController['getViewport']>;
  artboardOffset: ReturnType<
    typeof import('../artboard-offset').computeArtboardOffset
  >;
  artboardGroupRef: RefObject<Konva.Group | null>;
  overlayGroupRef: RefObject<Konva.Group | null>;
  transformerRef: RefObject<Konva.Transformer | null>;
  sizeLabelRef: RefObject<Konva.Label | null>;
  onSelectRef: RefObject<CanvasStageProps['onSelectLayer'] | undefined>;
  bumpViewport: () => void;
  overlayPrimitives: CanvasOverlayPrimitive[];
  flattenedLayers: ReturnType<typeof flattenStageLayers>;
  selectedLayerIdSet: Set<string>;
  selectedPrimary: string | null;
  selectionLabelBounds: SelectionBounds | null;
  sizeLabelOffsetX: number;
  sizeLabelText: string;
  activeDragAnchor: string | null;
  activeHandleAnchor: string | null;
  interactionPreviewLayerId: string | null;
  transformSessionLayerId: string | null;
  transformerEnabledAnchors: string[] | undefined;
  handleLayouts: ReturnType<typeof useHandleDragSession>['handleLayouts'];
  showHandles: boolean;
  handleHandlePointerDown: (anchor: string) => void;
  handleHandlePointerMove: () => void;
  handleHandlePointerUp: () => void;
  handleTransformStart: () => void;
  anchorDragBoundFunc: ReturnType<
    typeof useLayerTransformSession
  >['anchorDragBoundFunc'];
  boundBoxFunc: ReturnType<typeof useLayerTransformSession>['boundBoxFunc'];
  syncLabelFromTransformer: () => void;
  handlePointerHover: () => void;
  handlePointerLeave: () => void;
}

export function useCanvasStageRuntime(
  props: Pick<
    CanvasStageProps,
    | 'containerWidth'
    | 'containerHeight'
    | 'artboardWidth'
    | 'artboardHeight'
    | 'layers'
    | 'selectedLayerIds'
    | 'primaryLayerId'
    | 'hoveredLayerId'
    | 'editingLayerId'
    | 'pageMarginBounds'
    | 'showMargins'
    | 'showGrid'
    | 'gridSize'
    | 'userGuides'
    | 'onSelectLayer'
    | 'onHoverLayer'
    | 'onLayerDoubleClick'
    | 'onTransformChange'
    | 'onViewportChange'
    | 'viewportController'
    | 'canvasLayerInteractions'
    | 'stageInteraction'
  >
): CanvasStageShell {
  const {
    containerWidth,
    containerHeight,
    artboardWidth,
    artboardHeight,
    layers,
    selectedLayerIds,
    primaryLayerId = null,
    hoveredLayerId = null,
    editingLayerId = null,
    pageMarginBounds = null,
    showMargins = false,
    showGrid = false,
    gridSize = 8,
    userGuides,
    onSelectLayer,
    onHoverLayer,
    onLayerDoubleClick,
    onTransformChange,
    onViewportChange,
    viewportController: externalViewport,
    canvasLayerInteractions = [],
    stageInteraction = null,
  } = props;

  const runtimeRef = useRef<CanvasStageRuntime | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = createCanvasStageRuntime();
  }
  const runtime = runtimeRef.current;

  const stageContainerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const artboardGroupRef = useRef<Konva.Group>(null);
  const overlayGroupRef = useRef<Konva.Group>(null);
  const selectedLayerIdsRef = useRef(selectedLayerIds);
  const primaryLayerIdRef = useRef(primaryLayerId);
  const flattenedLayers = useMemo(() => flattenStageLayers(layers), [layers]);
  const flattenedLayerById = useMemo(
    () => new Map(flattenedLayers.map((entry) => [entry.layer.id, entry])),
    [flattenedLayers]
  );
  const stageInteractionRef = useRef<CanvasStageInteractionService | null>(
    stageInteraction
  );

  runtime.onSelectRef.current = onSelectLayer;
  runtime.onDoubleClickRef.current = onLayerDoubleClick;
  runtime.onTransformRef.current = onTransformChange;
  runtime.layersRef.current = flattenedLayers;
  runtime.selectedLayerIdsRef.current = selectedLayerIds;
  selectedLayerIdsRef.current = selectedLayerIds;
  primaryLayerIdRef.current = primaryLayerId;
  stageInteractionRef.current = stageInteraction;

  const selectedLayerIdSet = useMemo(
    () => new Set(selectedLayerIds),
    [selectedLayerIds]
  );
  runtime.selectedLayerIdSetRef.current = selectedLayerIdSet;

  const { artboardOffset, bumpViewport, viewport, vp } = useCanvasStageViewport(
    {
      artboardHeight,
      artboardWidth,
      containerHeight,
      containerWidth,
      onViewportChange,
      viewportController: externalViewport,
    }
  );

  const selectedPrimary = primaryLayerId ?? selectedLayerIds[0] ?? null;
  const selectedLayer = selectedPrimary
    ? flattenedLayerById.get(selectedPrimary)
    : undefined;
  const selectedTransform = selectedLayer?.layer.transform ?? null;
  const selectedInteraction = selectedLayer
    ? getInteraction(canvasLayerInteractions, selectedLayer.view.kind)
    : undefined;

  const {
    selectionLabelBounds,
    setSelectionLabelBounds,
    sizeLabelOffsetX,
    sizeLabelRef,
    sizeLabelText,
    syncLabelFromTransformer,
    updateSizeLabelImperatively,
  } = useSelectionLabel({
    artboardOffset,
    selectedPrimary,
    selectedTransform,
    transformerRef,
    vpZoom: vp.zoom,
  });

  const getMarginInset = useCallback(
    (): CanvasRect | null => (showMargins ? pageMarginBounds : null),
    [pageMarginBounds, showMargins]
  );

  const getGridConfig = useCallback(
    () => (showGrid ? { enabled: true as const, size: gridSize } : null),
    [gridSize, showGrid]
  );

  const getUserGuidesConfig = useCallback(() => {
    if (!userGuides || userGuides.length === 0) {
      return null;
    }
    return userGuidesToSnapAxes(userGuides);
  }, [userGuides]);

  const getOtherLayers = useCallback(
    (excludeIds: Set<string>): CanvasLayerTransformRef[] =>
      runtime.layersRef.current
        .filter(({ layer }) => !excludeIds.has(layer.id))
        .map(({ layer, absoluteTransform }) => ({
          layerType: layer.type,
          transform: absoluteTransform,
        })),
    [runtime]
  );

  const { clearOverlays, overlayPrimitives, setInteractionOverlays } =
    useCanvasOverlays({
      artboardHeight,
      artboardWidth,
      getMarginInset,
      gridSize,
      showGrid,
      showMargins,
      stageInteractionRef,
      zoom: vp.zoom,
    });

  const applyDragSnap = useCanvasDragSnap({
    artboardHeight,
    artboardWidth,
    dragSessionRef: runtime.dragSessionRef,
    getGridConfig,
    getMarginInset,
    getOtherLayers,
    getUserGuidesConfig,
    layersRef: runtime.layersRef,
    nodeRefs: runtime.nodeRefs,
    selectedLayerIdsRef,
    setInteractionOverlays,
    stageInteractionRef,
    zoom: vp.zoom,
  });

  const { handlePointerHover, handlePointerLeave } = useCanvasHover({
    artboardGroupRef,
    hoveredLayerId,
    nodeRefs: runtime.nodeRefs,
    onHoverLayer,
  });

  const isLayerWritableCallback = useCallback(
    (layer: SceneLayer) => canTransformLayer(layer),
    []
  );

  const { getTransformModifiers } = useTransformModifiers();

  const isNonEmptyGroupSelected =
    selectedLayer?.layer.type === CANVAS_GROUP_LAYER_TYPE &&
    getLayerChildren(selectedLayer.layer).length > 0;

  const isRichTextSelected = selectedInteraction?.kind === 'richText';

  const setActiveDragAnchor = useCallback(
    (anchor: string | null) => {
      if (anchor && selectedPrimary) {
        runtime.onTransformStart(selectedPrimary, anchor);
        return;
      }
      if (!anchor) {
        runtime.onTransformEnd();
      }
    },
    [runtime, selectedPrimary]
  );

  const {
    anchorDragBoundFunc,
    boundBoxFunc,
    completeLayerTransform,
    handleLayerTransform,
    handleTransformStart: startTransformSession,
    setTransformSessionLayerId,
    transformSessionActiveRef,
  } = useLayerTransformSession({
    artboardHeight,
    artboardWidth,
    clearOverlays,
    flattenedLayers,
    getGridConfig,
    getMarginInset,
    getOtherLayers,
    getUserGuidesConfig,
    getTransformModifiers,
    isRichTextSelected,
    nodeRefs: runtime.nodeRefs,
    onTransformRef: runtime.onTransformRef,
    primaryLayerIdRef,
    selectedInteraction,
    selectedLayer,
    selectedLayerIdsRef,
    selectedPrimary,
    setActiveDragAnchor,
    setInteractionOverlays,
    setLiveTransformOverride: runtime.setLiveTransformOverride.bind(runtime),
    setLiveTransformOverrides: runtime.setLiveTransformOverrides.bind(runtime),
    stageInteractionRef,
    syncLabelFromTransformer,
    transformerRef,
    updateSizeLabelImperatively,
    vpZoom: vp.zoom,
  });

  const handleTransformStart = useCallback(() => {
    startTransformSession();
  }, [startTransformSession]);

  const activeDragAnchor = useStoreSelector(runtime, selectActiveDragAnchor);
  const activeHandleAnchor = useStoreSelector(
    runtime,
    selectActiveHandleAnchor
  );
  const interactionPreviewLayerId = useStoreSelector(
    runtime,
    selectInteractionPreviewLayerId
  );
  const transformSessionLayerId = useStoreSelector(
    runtime,
    selectTransformSessionLayerId
  );

  useEffect(() => {
    runtime.bindLayerHandlers({
      applyDragSnap,
      clearOverlays,
      completeLayerTransform,
      handleLayerTransform,
      syncLabelFromTransformer,
    });
  }, [
    applyDragSnap,
    clearOverlays,
    completeLayerTransform,
    handleLayerTransform,
    runtime,
    syncLabelFromTransformer,
  ]);

  const {
    handleHandlePointerDown: startHandleDrag,
    handleHandlePointerMove,
    handleHandlePointerUp: endHandleDrag,
    handleLayouts,
    showHandles,
  } = useHandleDragSession({
    canvasLayerInteractions,
    clearOverlays,
    editingLayerId,
    flattenedLayers,
    getLayerTransform: runtime.getLayerTransform.bind(runtime),
    isLayerWritableCallback,
    nodeRefs: runtime.nodeRefs,
    onTransformRef: runtime.onTransformRef,
    onHandleDragCleared: () => {
      runtime.onHandleDragEnd();
    },
    selectedInteraction,
    selectedLayer,
    selectedLayerIds,
    selectedLayerIdsRef,
    selectedPrimary,
    selectedTransform,
    setInteractionOverlays,
    setLiveTransformOverride: runtime.setLiveTransformOverride.bind(runtime),
    setLiveTransformOverrides: runtime.setLiveTransformOverrides.bind(runtime),
    setSelectionLabelBounds,
    setTransformSessionLayerId,
    syncLabelFromTransformer,
    transformSessionLayerId,
    transformerRef,
    vpZoom: vp.zoom,
  });

  const handleHandlePointerDown = useCallback(
    (anchor: string) => {
      startHandleDrag(anchor);
      if (selectedPrimary) {
        runtime.onHandleDragStart(selectedPrimary, anchor);
      }
    },
    [runtime, selectedPrimary, startHandleDrag]
  );

  const handleHandlePointerUp = useCallback(() => {
    endHandleDrag();
    runtime.onHandleDragEnd();
  }, [endHandleDrag, runtime]);

  const previousPrimaryRef = useRef<string | null>(selectedPrimary);
  useEffect(() => {
    const previousPrimary = previousPrimaryRef.current;
    if (
      previousPrimary &&
      previousPrimary !== selectedPrimary &&
      runtime.getInteractionPreviewLayerId() === previousPrimary
    ) {
      const previousLayer = flattenedLayerById.get(previousPrimary);
      if (previousLayer) {
        const previousInteraction = getInteraction(
          canvasLayerInteractions,
          previousLayer.view.kind
        );
        previousInteraction?.onLayerDeactivate?.(previousPrimary);
      }
      runtime.exitInteractionPreview();
    }
    previousPrimaryRef.current = selectedPrimary;
  }, [canvasLayerInteractions, flattenedLayerById, runtime, selectedPrimary]);

  const { transformerEnabledAnchors } = useTransformerAttachment({
    activeDragAnchor,
    activeHandleAnchor,
    editingLayerId,
    isNonEmptyGroupSelected,
    nodeRefs: runtime.nodeRefs,
    selectedInteraction,
    selectedLayerIds,
    selectedPrimary,
    selectedTransform,
    syncLabelFromTransformer,
    transformSessionActiveRef,
    transformerRef,
  });

  return {
    activeDragAnchor,
    activeHandleAnchor,
    anchorDragBoundFunc,
    artboardGroupRef,
    artboardOffset,
    boundBoxFunc,
    bumpViewport,
    flattenedLayers,
    handleHandlePointerDown,
    handleHandlePointerMove,
    handleHandlePointerUp,
    handleLayouts,
    handlePointerHover,
    handlePointerLeave,
    handleTransformStart,
    interactionPreviewLayerId,
    onSelectRef: runtime.onSelectRef,
    overlayGroupRef,
    overlayPrimitives,
    runtime,
    selectedLayerIdSet,
    selectedPrimary,
    selectionLabelBounds,
    showHandles,
    sizeLabelOffsetX,
    sizeLabelRef,
    sizeLabelText,
    stageContainerRef,
    syncLabelFromTransformer,
    transformSessionLayerId,
    transformerEnabledAnchors,
    transformerRef,
    viewport,
    vp,
  };
}
