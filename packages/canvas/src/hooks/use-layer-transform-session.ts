import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import type { Transform } from '@openenvx/schema';
import type Konva from 'konva';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { SelectionBounds } from '../canvas-stage-types';
import {
  applyTransformerAnchorVisibility,
  attachTransformerToNodes,
} from '../canvas-transformer-utils';
import {
  bakeNodeTransform,
  clampAnchorDragPosition,
  createTransformDragContext,
  normalizeNodeBeforeTransform,
} from '../geometry';
import type { TransformDragContext } from '../geometry';
import type { GenericTransformSession } from '../interactions/generic-transform-driver';
import {
  selectTransformStrategy,
  type TransformSessionRefs,
} from '../interactions/layer-transform-strategy';
import {
  RICH_TEXT_ENABLED_ANCHORS,
  type RichTextCornerSession,
} from '../interactions/rich-text-transform-driver';
import type { CanvasLayerInteractionRegistration } from '../registry/canvas-registry-types';
import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';
import type {
  CanvasGridSnapConfig,
  CanvasLayerTransformRef,
  CanvasRect,
  CanvasStageInteractionService,
} from '../stage/canvas-stage-interaction';

export interface UseLayerTransformSessionInput {
  artboardHeight: number;
  artboardWidth: number;
  flattenedLayers: { layer: SceneLayer; view: LayerPreviewDescriptor }[];
  getGridConfig: () => CanvasGridSnapConfig | null;
  getMarginInset: () => CanvasRect | null;
  getOtherLayers: (excludeIds: Set<string>) => CanvasLayerTransformRef[];
  getTransformModifiers: () => {
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
  isRichTextSelected: boolean;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  onTransformRef: RefObject<
    | ((
        layerId: string,
        change: {
          transform: Transform;
          fontSize?: number;
          dataPatch?: Record<string, unknown>;
        }
      ) => void)
    | undefined
  >;
  primaryLayerIdRef: RefObject<string | null>;
  selectedLayer:
    | { layer: SceneLayer; view: LayerPreviewDescriptor }
    | undefined;
  selectedInteraction: CanvasLayerInteractionRegistration | undefined;
  selectedLayerIdsRef: RefObject<string[]>;
  selectedPrimary: string | null;
  setActiveDragAnchor: (anchor: string | null) => void;
  setLiveTransformOverride: (
    layerId: string,
    transform: Transform | null
  ) => void;
  setLiveTransformOverrides: (overrides: Map<string, Transform>) => void;
  clearOverlays: () => void;
  setInteractionOverlays: (overlays: CanvasOverlayPrimitive[]) => void;
  stageInteractionRef: RefObject<CanvasStageInteractionService | null>;
  syncLabelFromTransformer: () => void;
  transformerRef: RefObject<Konva.Transformer | null>;
  updateSizeLabelImperatively: (bounds: SelectionBounds) => void;
  vpZoom: number;
}

export function useLayerTransformSession({
  artboardHeight,
  artboardWidth,
  flattenedLayers,
  getGridConfig,
  getMarginInset,
  getOtherLayers,
  getTransformModifiers,
  isRichTextSelected,
  nodeRefs,
  onTransformRef,
  primaryLayerIdRef,
  selectedInteraction,
  selectedLayer,
  selectedLayerIdsRef,
  selectedPrimary,
  setActiveDragAnchor,
  setLiveTransformOverride,
  setLiveTransformOverrides,
  clearOverlays,
  setInteractionOverlays,
  stageInteractionRef,
  syncLabelFromTransformer,
  transformerRef,
  updateSizeLabelImperatively,
  vpZoom,
}: UseLayerTransformSessionInput) {
  const [transformSessionLayerId, setTransformSessionLayerId] = useState<
    string | null
  >(null);
  const transformSessionActiveRef = useRef(false);
  const transformDragRef = useRef<TransformDragContext | null>(null);
  const richTextCornerSessionRef = useRef<RichTextCornerSession | null>(null);
  const genericTransformSessionRef = useRef<GenericTransformSession | null>(
    null
  );
  const cornerBakeRafRef = useRef<number | null>(null);
  const richTextBakeInProgressRef = useRef(false);
  const isRichTextSelectedRef = useRef(isRichTextSelected);
  isRichTextSelectedRef.current = isRichTextSelected;

  const sessionRefs = useMemo<TransformSessionRefs>(
    () => ({
      bakeInProgressRef: richTextBakeInProgressRef,
      cornerBakeRafRef,
      genericTransformSessionRef,
      richTextCornerSessionRef,
      transformDragRef,
    }),
    []
  );

  const handleTransformEnd = useCallback(() => {
    transformSessionActiveRef.current = false;
    setTransformSessionLayerId(null);
    setLiveTransformOverrides(new Map());
    setActiveDragAnchor(null);
    clearOverlays();
    applyTransformerAnchorVisibility(
      transformerRef.current,
      null,
      isRichTextSelectedRef.current ? [...RICH_TEXT_ENABLED_ANCHORS] : null
    );
    transformDragRef.current = null;
    selectTransformStrategy('richText').endSession(sessionRefs);
    selectTransformStrategy('image').endSession(sessionRefs);
  }, [
    clearOverlays,
    sessionRefs,
    setActiveDragAnchor,
    setLiveTransformOverrides,
    transformerRef,
  ]);

  const handleTransformStart = useCallback(() => {
    if (transformSessionActiveRef.current) {
      return;
    }
    transformSessionActiveRef.current = true;
    const transformer = transformerRef.current;
    const node = transformer?.nodes()[0] as Konva.Group | undefined;
    if (node) {
      normalizeNodeBeforeTransform(node);
    }

    const activeAnchor = transformer?.getActiveAnchor() ?? null;
    if (activeAnchor) {
      setActiveDragAnchor(activeAnchor);
      applyTransformerAnchorVisibility(transformer ?? null, activeAnchor, null);
    }

    if (selectedPrimary && selectedInteraction && selectedLayer && node) {
      setTransformSessionLayerId(selectedPrimary);
      selectTransformStrategy(selectedInteraction.kind).start({
        activeAnchor,
        getTransformModifiers,
        interaction: selectedInteraction,
        layer: selectedLayer.layer,
        layerId: selectedPrimary,
        node,
        nodeRefs: nodeRefs.current,
        refs: sessionRefs,
        setLiveTransformOverride,
        transformer: transformer ?? null,
        updateSizeLabelImperatively,
        view: selectedLayer.view,
      });
    } else {
      transformDragRef.current = transformer
        ? createTransformDragContext(transformer)
        : null;
    }
  }, [
    getTransformModifiers,
    nodeRefs,
    selectedInteraction,
    selectedLayer,
    selectedPrimary,
    sessionRefs,
    setActiveDragAnchor,
    setLiveTransformOverride,
    transformerRef,
    updateSizeLabelImperatively,
  ]);

  const updateResizeGuides = useCallback(() => {
    const anchor = transformDragRef.current?.anchor ?? '';
    if (!anchor || anchor === 'rotater') {
      clearOverlays();
    }
  }, [clearOverlays]);

  const anchorDragBoundFunc = useCallback(
    (oldAbs: { x: number; y: number }, newAbs: { x: number; y: number }) => {
      const ctx = transformDragRef.current;
      if (!ctx) {
        return newAbs;
      }
      return clampAnchorDragPosition(oldAbs, newAbs, ctx);
    },
    []
  );

  const boundBoxFunc = useCallback(
    (
      oldBox: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
      },
      newBox: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
      }
    ) => {
      const interaction = stageInteractionRef.current;
      const anchor = transformDragRef.current?.anchor ?? '';
      let nextBox = newBox;

      const richTextBox = selectTransformStrategy('richText').boundBox({
        getTransformModifiers,
        newBox,
        oldBox,
        refs: sessionRefs,
        setLiveTransformOverride,
        transformerRef,
      });
      if (richTextBox) {
        nextBox = richTextBox;
      } else if (genericTransformSessionRef.current) {
        const genericBox = selectTransformStrategy('image').boundBox({
          getTransformModifiers,
          newBox,
          oldBox,
          refs: sessionRefs,
          setLiveTransformOverride,
          transformerRef,
        });
        if (genericBox) {
          nextBox = genericBox;
        }
      }

      if (!anchor || anchor === 'rotater') {
        return nextBox;
      }

      const adjusted = interaction?.adjustResize?.({
        anchor,
        artboard: { height: artboardHeight, width: artboardWidth },
        box: nextBox,
        grid: getGridConfig(),
        marginInset: getMarginInset(),
        others: getOtherLayers(new Set(selectedLayerIdsRef.current)),
        zoom: vpZoom,
      });
      if (adjusted) {
        setInteractionOverlays([...adjusted.overlays]);
      }
      return adjusted?.box ?? nextBox;
    },
    [
      artboardHeight,
      artboardWidth,
      getGridConfig,
      getMarginInset,
      getOtherLayers,
      getTransformModifiers,
      selectedLayerIdsRef,
      sessionRefs,
      setInteractionOverlays,
      setLiveTransformOverride,
      stageInteractionRef,
      transformerRef,
      vpZoom,
    ]
  );

  const scheduleRichTextLiveBake = useCallback(
    (
      layerId: string,
      view: Extract<LayerPreviewDescriptor, { kind: 'richText' }>
    ) => {
      const node = nodeRefs.current.get(layerId);
      if (!node) {
        return;
      }
      selectTransformStrategy('richText').live({
        flattenedLayers,
        getTransformModifiers,
        layerId,
        node,
        nodeRefs: nodeRefs.current,
        refs: sessionRefs,
        setLiveTransformOverride,
        transformerRef,
        updateSizeLabelImperatively,
        view,
      });
    },
    [
      flattenedLayers,
      getTransformModifiers,
      nodeRefs,
      sessionRefs,
      setLiveTransformOverride,
      transformerRef,
      updateSizeLabelImperatively,
    ]
  );

  const handleLayerTransform = useCallback(
    (
      layerId: string,
      node: Konva.Group,
      view: LayerPreviewDescriptor,
      interactionKind: string | undefined
    ) => {
      const transformPrimary =
        primaryLayerIdRef.current ?? selectedLayerIdsRef.current[0] ?? null;
      if (layerId !== transformPrimary) {
        return;
      }

      const strategy = selectTransformStrategy(interactionKind);
      strategy.live({
        flattenedLayers,
        getTransformModifiers,
        layerId,
        node,
        nodeRefs: nodeRefs.current,
        refs: sessionRefs,
        setLiveTransformOverride,
        transformerRef,
        updateSizeLabelImperatively,
        view,
      });

      if (interactionKind !== 'richText') {
        updateResizeGuides();
        syncLabelFromTransformer();
      }
    },
    [
      flattenedLayers,
      getTransformModifiers,
      nodeRefs,
      primaryLayerIdRef,
      selectedLayerIdsRef,
      sessionRefs,
      setLiveTransformOverride,
      syncLabelFromTransformer,
      transformerRef,
      updateSizeLabelImperatively,
      updateResizeGuides,
    ]
  );

  const completeLayerTransform = useCallback(
    ({
      layerId,
      view,
      transform,
      node,
      interactionKind,
    }: {
      layerId: string;
      view: LayerPreviewDescriptor;
      transform: NonNullable<SceneLayer['transform']>;
      node: Konva.Group;
      interactionKind: string | undefined;
    }) => {
      let nextTransform = bakeNodeTransform(transform, node);
      let nextFontSize: number | undefined;
      let nextDataPatch: Record<string, unknown> | undefined;

      const strategyResult = selectTransformStrategy(interactionKind).complete({
        getTransformModifiers,
        layerId,
        node,
        nodeRefs: nodeRefs.current,
        refs: sessionRefs,
        setLiveTransformOverride,
        transform,
        transformerRef,
        updateSizeLabelImperatively,
        view,
      });
      if (strategyResult) {
        nextTransform = strategyResult.transform;
        nextFontSize = strategyResult.fontSize;
        nextDataPatch = strategyResult.dataPatch;
      }

      handleTransformEnd();
      onTransformRef.current?.(layerId, {
        dataPatch: nextDataPatch,
        fontSize: nextFontSize,
        transform: nextTransform,
      });
      if (selectedLayerIdsRef.current.includes(layerId)) {
        requestAnimationFrame(() => {
          const nodes = selectedLayerIdsRef.current
            .map((id) => nodeRefs.current.get(id))
            .filter((entry): entry is Konva.Group => Boolean(entry));
          attachTransformerToNodes(transformerRef.current, nodes);
          syncLabelFromTransformer();
        });
      }
    },
    [
      getTransformModifiers,
      handleTransformEnd,
      nodeRefs,
      onTransformRef,
      selectedLayerIdsRef,
      sessionRefs,
      setLiveTransformOverride,
      syncLabelFromTransformer,
      transformerRef,
      updateSizeLabelImperatively,
    ]
  );

  return {
    anchorDragBoundFunc,
    boundBoxFunc,
    completeLayerTransform,
    handleLayerTransform,
    handleTransformEnd,
    handleTransformStart,
    scheduleRichTextLiveBake,
    setTransformSessionLayerId,
    transformSessionActiveRef,
    transformSessionLayerId,
    updateResizeGuides,
  };
}
