import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/core/preview';
import { createDefaultTransform } from '@openenvx/core/schema';
import type { Transform } from '@openenvx/core/schema';
import type Konva from 'konva';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { CanvasStageProps, SelectionBounds } from '../canvas-stage-types';
import { reattachTransformerFromSelection } from '../canvas-transformer-utils';
import { pointerToParentLocal } from '../geometry';
import type {
  CanvasHandleDragContext,
  CanvasLayerInteractionRegistration,
  HandleDescriptor,
} from '../registry/canvas-registry-types';
import { setStageContentCursor } from '../resize-handle-cursor';
import { nodePositionToAbsolute } from '../snap/absolute-snap-to-node-position';
import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';
import { resolveHandleDragTarget } from './resolve-handle-drag-target';
import { useDragEndListeners } from './use-drag-end-listeners';

interface HandleDragRef {
  anchor: string;
  layerId: string;
  originTransform: Transform;
}

interface FlattenedLayerEntry {
  layer: SceneLayer;
  view: LayerPreviewDescriptor;
}

export interface UseHandleDragSessionInput {
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  clearOverlays: () => void;
  editingLayerId: string | null;
  flattenedLayers: FlattenedLayerEntry[];
  getLayerTransform: (
    layerId: string,
    transform: NonNullable<SceneLayer['transform']>
  ) => NonNullable<SceneLayer['transform']>;
  isLayerWritableCallback: (layer: SceneLayer) => boolean;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  onTransformRef: RefObject<CanvasStageProps['onTransformChange']>;
  onHandleDragCleared?: () => void;
  selectedInteraction: CanvasLayerInteractionRegistration | undefined;
  selectedLayer: FlattenedLayerEntry | undefined;
  selectedLayerIds: string[];
  selectedLayerIdsRef: RefObject<string[]>;
  selectedPrimary: string | null;
  selectedTransform: SceneLayer['transform'] | null;
  setInteractionOverlays: (overlays: CanvasOverlayPrimitive[]) => void;
  setLiveTransformOverride: (
    layerId: string,
    transform: Transform | null
  ) => void;
  setLiveTransformOverrides: (overrides: Map<string, Transform>) => void;
  setSelectionLabelBounds: (bounds: SelectionBounds | null) => void;
  setTransformSessionLayerId: (layerId: string | null) => void;
  syncLabelFromTransformer: () => void;
  transformSessionLayerId: string | null;
  transformerRef: RefObject<Konva.Transformer | null>;
  vpZoom: number;
}

function createHandleDragContext(input: {
  anchor: string;
  entry: FlattenedLayerEntry;
  layerId: string;
  node: Konva.Group;
  originTransform: Transform;
  setInteractionOverlays: (overlays: CanvasOverlayPrimitive[]) => void;
  setLiveTransformOverride: (
    layerId: string,
    transform: Transform | null
  ) => void;
  zoom: number;
}): CanvasHandleDragContext {
  return {
    anchor: input.anchor,
    layerId: input.layerId,
    node: input.node,
    setLiveTransform: (nextTransform) => {
      input.setLiveTransformOverride(input.layerId, nextTransform);
    },
    setOverlays: input.setInteractionOverlays,
    transform: input.originTransform,
    view: input.entry.view,
    zoom: input.zoom,
  };
}

export function useHandleDragSession({
  canvasLayerInteractions,
  clearOverlays,
  editingLayerId,
  flattenedLayers,
  getLayerTransform,
  isLayerWritableCallback,
  nodeRefs,
  onTransformRef,
  onHandleDragCleared,
  selectedInteraction,
  selectedLayer,
  selectedLayerIds,
  selectedLayerIdsRef,
  selectedPrimary,
  selectedTransform,
  setInteractionOverlays,
  setLiveTransformOverride,
  setLiveTransformOverrides,
  setSelectionLabelBounds,
  setTransformSessionLayerId,
  syncLabelFromTransformer,
  transformSessionLayerId,
  transformerRef,
  vpZoom,
}: UseHandleDragSessionInput) {
  const [activeHandleAnchorState, setActiveHandleAnchor] = useState<
    string | null
  >(null);
  // Live node position while dragging - scene transform only commits on drag end.
  const [liveHandlePosition, setLiveHandlePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const handleDragRef = useRef<HandleDragRef | null>(null);
  const handleHandlePointerUpRef = useRef<() => void>(() => {});
  const detachEndDragListenersRef = useRef<() => void>(() => {});
  const selectedPrimaryRef = useRef(selectedPrimary);
  selectedPrimaryRef.current = selectedPrimary;
  const selectedTransformRef = useRef(selectedTransform);
  selectedTransformRef.current = selectedTransform;
  const selectedRelativeTransformRef = useRef(
    selectedLayer?.layer.transform ?? null
  );
  selectedRelativeTransformRef.current = selectedLayer?.layer.transform ?? null;

  const clearHandleDragState = useCallback(
    (options?: { clearLiveOverrides?: boolean }) => {
      const layerId =
        handleDragRef.current?.layerId ?? selectedPrimaryRef.current;
      if (layerId) {
        setStageContentCursor(nodeRefs.current?.get(layerId) ?? null, '');
      }
      handleDragRef.current = null;
      setActiveHandleAnchor(null);
      setTransformSessionLayerId(null);
      detachEndDragListenersRef.current();
      clearOverlays();
      if (options?.clearLiveOverrides !== false) {
        setLiveTransformOverrides(new Map());
      }
      onHandleDragCleared?.();
    },
    [
      clearOverlays,
      nodeRefs,
      onHandleDragCleared,
      setLiveTransformOverrides,
      setTransformSessionLayerId,
    ]
  );

  const { attachEndDragListeners, detachEndDragListeners } =
    useDragEndListeners({
      clearHandleDragState,
      nodeRefs,
      onEndDrag: () => {
        handleHandlePointerUpRef.current();
      },
      selectedLayerIdsRef,
      syncLabelFromTransformer,
      transformerRef,
    });
  detachEndDragListenersRef.current = detachEndDragListeners;

  const handleHandlePointerUp = useCallback(() => {
    const drag = handleDragRef.current;
    if (!drag) {
      return;
    }

    const target = resolveHandleDragTarget({
      canvasLayerInteractions,
      drag,
      flattenedLayers,
      nodeRefs,
    });

    if (!target?.interaction.onHandleDragEnd) {
      clearHandleDragState();
      return;
    }

    const result = target.interaction.onHandleDragEnd(
      createHandleDragContext({
        anchor: drag.anchor,
        entry: target.entry,
        layerId: drag.layerId,
        node: target.node,
        originTransform: drag.originTransform,
        setInteractionOverlays,
        setLiveTransformOverride,
        zoom: vpZoom,
      })
    );

    clearHandleDragState();

    if (result) {
      onTransformRef.current?.(drag.layerId, {
        dataPatch: result.dataPatch,
        fontSize: result.fontSize,
        transform: result.transform,
      });
    }

    reattachTransformerFromSelection(
      nodeRefs,
      selectedLayerIdsRef,
      transformerRef,
      syncLabelFromTransformer
    );
  }, [
    canvasLayerInteractions,
    clearHandleDragState,
    flattenedLayers,
    nodeRefs,
    onTransformRef,
    selectedLayerIdsRef,
    setInteractionOverlays,
    setLiveTransformOverride,
    syncLabelFromTransformer,
    transformerRef,
    vpZoom,
  ]);

  handleHandlePointerUpRef.current = handleHandlePointerUp;

  const showHandles = Boolean(
    selectedPrimary &&
    selectedLayer &&
    selectedLayerIds.length === 1 &&
    !editingLayerId &&
    !transformSessionLayerId &&
    !activeHandleAnchorState &&
    isLayerWritableCallback(selectedLayer.layer) &&
    selectedInteraction?.providesHandles?.(selectedLayer.view)
  );

  const syncHandlesFromNode = useCallback(
    (layerId: string) => {
      if (layerId !== selectedPrimaryRef.current) {
        return;
      }
      const node = nodeRefs.current?.get(layerId);
      const absolute = selectedTransformRef.current;
      if (!node || !absolute) {
        return;
      }
      const relative = selectedRelativeTransformRef.current ?? absolute;
      setLiveHandlePosition(
        nodePositionToAbsolute(node.x(), node.y(), relative, absolute)
      );
    },
    [nodeRefs]
  );

  // Scene transform catches up after drag end - drop the live override.
  useEffect(() => {
    setLiveHandlePosition(null);
  }, [selectedTransform]);

  // Hover cursor can stick if handles unmount without mouseLeave (reselect/edit).
  // Skip while a handle-anchor drag keeps the cursor intentionally sticky.
  useEffect(() => {
    if (showHandles || activeHandleAnchorState) {
      return;
    }
    const layerId = selectedPrimaryRef.current;
    setStageContentCursor(
      layerId ? (nodeRefs.current?.get(layerId) ?? null) : null,
      ''
    );
  }, [activeHandleAnchorState, nodeRefs, showHandles]);

  const handleLayouts = useMemo((): HandleDescriptor[] => {
    if (
      !showHandles ||
      !selectedPrimary ||
      !selectedLayer ||
      !selectedTransform ||
      !selectedInteraction?.layoutHandles
    ) {
      return [];
    }
    const node = nodeRefs.current?.get(selectedPrimary);
    if (!node) {
      return [];
    }
    const sceneTransform = getLayerTransform(
      selectedPrimary,
      selectedTransform
    );
    const transform = liveHandlePosition
      ? { ...sceneTransform, ...liveHandlePosition }
      : sceneTransform;
    return selectedInteraction.layoutHandles({
      layerId: selectedPrimary,
      node,
      transform,
      view: selectedLayer.view,
      zoom: vpZoom,
    });
  }, [
    getLayerTransform,
    liveHandlePosition,
    nodeRefs,
    selectedInteraction,
    selectedLayer,
    selectedPrimary,
    selectedTransform,
    showHandles,
    vpZoom,
  ]);

  const handleHandlePointerDown = useCallback(
    (anchor: string) => {
      if (!selectedPrimary || !selectedLayer || !selectedInteraction) {
        return;
      }
      if (!isLayerWritableCallback(selectedLayer.layer)) {
        return;
      }
      const node = nodeRefs.current?.get(selectedPrimary);
      if (!node || !selectedInteraction.onHandleDragStart) {
        return;
      }

      const originTransform =
        selectedLayer.layer.transform ?? createDefaultTransform();
      handleDragRef.current = {
        anchor,
        layerId: selectedPrimary,
        originTransform,
      };
      setActiveHandleAnchor(anchor);
      setTransformSessionLayerId(selectedPrimary);
      transformerRef.current?.nodes([]);

      selectedInteraction.onHandleDragStart(
        createHandleDragContext({
          anchor,
          entry: selectedLayer,
          layerId: selectedPrimary,
          node,
          originTransform,
          setInteractionOverlays,
          setLiveTransformOverride,
          zoom: vpZoom,
        })
      );
      attachEndDragListeners();
    },
    [
      attachEndDragListeners,
      isLayerWritableCallback,
      nodeRefs,
      selectedInteraction,
      selectedLayer,
      selectedPrimary,
      setInteractionOverlays,
      setLiveTransformOverride,
      setTransformSessionLayerId,
      transformerRef,
      vpZoom,
    ]
  );

  const handleHandlePointerMove = useCallback(() => {
    const drag = handleDragRef.current;
    if (!drag) {
      return;
    }

    const target = resolveHandleDragTarget({
      canvasLayerInteractions,
      drag,
      flattenedLayers,
      nodeRefs,
    });
    if (!target?.interaction.onHandleDragMove) {
      return;
    }

    const pointer = pointerToParentLocal(target.stage, target.parent);
    if (!pointer) {
      return;
    }

    let nextLiveTransform: Transform | null = null;
    let liveTransformApplied = false;
    target.interaction.onHandleDragMove(
      createHandleDragContext({
        anchor: drag.anchor,
        entry: target.entry,
        layerId: drag.layerId,
        node: target.node,
        originTransform: drag.originTransform,
        setInteractionOverlays,
        setLiveTransformOverride: (layerId, transform) => {
          nextLiveTransform = transform;
          liveTransformApplied = true;
          setLiveTransformOverride(layerId, transform);
        },
        zoom: vpZoom,
      }),
      pointer
    );

    const liveTransform = liveTransformApplied
      ? (nextLiveTransform ?? drag.originTransform)
      : getLayerTransform(drag.layerId, drag.originTransform);
    setSelectionLabelBounds({
      height: liveTransform.height,
      width: liveTransform.width,
      x: liveTransform.x,
      y: liveTransform.y,
    });
  }, [
    canvasLayerInteractions,
    flattenedLayers,
    getLayerTransform,
    nodeRefs,
    setInteractionOverlays,
    setLiveTransformOverride,
    setSelectionLabelBounds,
    vpZoom,
  ]);

  return {
    activeHandleAnchor: activeHandleAnchorState,
    handleHandlePointerDown,
    handleHandlePointerMove,
    handleHandlePointerUp,
    handleLayouts,
    showHandles,
    syncHandlesFromNode,
  };
}
