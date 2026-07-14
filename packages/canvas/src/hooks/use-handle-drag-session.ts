import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { createDefaultTransform } from '@openenvx/schema';
import type { Transform } from '@openenvx/schema';
import type Konva from 'konva';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { CanvasStageProps, SelectionBounds } from '../canvas-stage-types';
import { reattachTransformerFromSelection } from '../canvas-transformer-utils';
import { pointerToParentLocal } from '../geometry';
import type {
  CanvasHandleDragContext,
  CanvasLayerInteractionRegistration,
  HandleDescriptor,
} from '../registry/canvas-registry-types';
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
  const handleDragRef = useRef<HandleDragRef | null>(null);
  const handleHandlePointerUpRef = useRef<() => void>(() => {});
  const detachEndDragListenersRef = useRef<() => void>(() => {});

  const clearHandleDragState = useCallback(
    (options?: { clearLiveOverrides?: boolean }) => {
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
    return selectedInteraction.layoutHandles({
      layerId: selectedPrimary,
      node,
      transform: getLayerTransform(selectedPrimary, selectedTransform),
      view: selectedLayer.view,
      zoom: vpZoom,
    });
  }, [
    getLayerTransform,
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
  };
}
