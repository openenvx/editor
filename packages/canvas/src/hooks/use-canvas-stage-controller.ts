import type { Layer as SceneLayer } from '@openenvx/core';
import { isLayerEditable, isLayerWritable } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { createDefaultTransform } from '@openenvx/schema';
import type Konva from 'konva';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RefObject } from 'react';

import { computeArtboardOffset } from '../artboard-offset';
import type {
  CanvasStageLayer,
  CanvasStageProps,
  DragSession,
  SelectionBounds,
} from '../canvas-stage-types';
import {
  applyTransformerAnchorVisibility,
  attachTransformerToNodes,
  getInteraction,
} from '../canvas-transformer-utils';
import {
  bakeNodeTransform,
  clampAnchorDragPosition,
  createTransformDragContext,
  normalizeNodeBeforeTransform,
} from '../geometry';
import type { TransformDragContext } from '../geometry';
import {
  bakeRichTextTransformEnd,
  boundRichTextBox,
  createRichTextTransformRuntime,
  endRichTextTransformSession,
  RICH_TEXT_ENABLED_ANCHORS,
  runRichTextLiveBake,
  startRichTextTransform,
} from '../interactions/rich-text-transform-driver';
import type { RichTextCornerSession } from '../interactions/rich-text-transform-driver';
import { isRichTextHorizontalAnchor } from '../rich-text-resize';
import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';
import type {
  CanvasLayerTransformRef,
  CanvasRect,
  CanvasStageInteractionService,
} from '../stage/canvas-stage-interaction';
import { ViewportController } from '../viewport';
import { useCanvasDragSnap } from './use-canvas-drag-snap';
import { useCanvasOverlays } from './use-canvas-overlays';

export interface CanvasStageController {
  stageContainerRef: RefObject<HTMLDivElement | null>;
  viewport: ViewportController;
  vp: ReturnType<ViewportController['getViewport']>;
  artboardOffset: ReturnType<typeof computeArtboardOffset>;
  artboardGroupRef: RefObject<Konva.Group | null>;
  overlayGroupRef: RefObject<Konva.Group | null>;
  transformerRef: RefObject<Konva.Transformer | null>;
  sizeLabelRef: RefObject<Konva.Label | null>;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  selectedPrimary: string | null;
  selectedLayerIdSet: Set<string>;
  selectedLayerIds: string[];
  selectedTransform: SceneLayer['transform'] | null;
  selectedInteraction: ReturnType<typeof getInteraction> | undefined;
  editingLayerId: string | null;
  transformSessionLayerId: string | null;
  overlayPrimitives: CanvasOverlayPrimitive[];
  selectionLabelBounds: SelectionBounds | null;
  sizeLabelOffsetX: number;
  sizeLabelText: string;
  activeDragAnchor: string | null;
  transformerEnabledAnchors: string[] | undefined;
  isLayerSelectable: (layer: SceneLayer) => boolean;
  isLayerWritableCallback: (layer: SceneLayer) => boolean;
  onSelectRef: RefObject<CanvasStageProps['onSelectLayer']>;
  onDoubleClickRef: RefObject<CanvasStageProps['onLayerDoubleClick']>;
  onTransformRef: RefObject<CanvasStageProps['onTransformChange']>;
  layersRef: RefObject<CanvasStageLayer[]>;
  dragSessionRef: RefObject<DragSession | null>;
  bumpViewport: () => void;
  clearOverlays: () => void;
  applyDragSnap: (
    layerId: string,
    node: Konva.Group,
    transform: NonNullable<SceneLayer['transform']>
  ) => void;
  handleTransformStart: () => void;
  handleTransformEnd: () => void;
  anchorDragBoundFunc: (
    oldAbs: { x: number; y: number },
    newAbs: { x: number; y: number }
  ) => { x: number; y: number };
  boundBoxFunc: (
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
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  syncLabelFromTransformer: () => void;
  handlePointerHover: () => void;
  handlePointerLeave: () => void;
  scheduleRichTextLiveBake: (
    layerId: string,
    view: Extract<LayerPreviewDescriptor, { kind: 'richText' }>
  ) => void;
  updateResizeGuides: () => void;
  handleLayerTransform: (
    layerId: string,
    node: Konva.Group,
    view: LayerPreviewDescriptor,
    interactionKind: string | undefined
  ) => void;
  completeLayerTransform: (input: {
    layerId: string;
    view: LayerPreviewDescriptor;
    transform: NonNullable<SceneLayer['transform']>;
    node: Konva.Group;
    interactionKind: string | undefined;
  }) => void;
}

export function useCanvasStageController({
  containerWidth,
  containerHeight,
  artboardWidth,
  artboardHeight,
  layers,
  selectedLayerIds,
  hoveredLayerId = null,
  editingLayerId = null,
  pageMarginBounds = null,
  showMargins = false,
  onSelectLayer,
  onHoverLayer,
  onLayerDoubleClick,
  onTransformChange,
  onViewportChange,
  viewportController: externalViewport,
  canvasLayerInteractions = [],
  stageInteraction = null,
}: Pick<
  CanvasStageProps,
  | 'containerWidth'
  | 'containerHeight'
  | 'artboardWidth'
  | 'artboardHeight'
  | 'layers'
  | 'selectedLayerIds'
  | 'hoveredLayerId'
  | 'editingLayerId'
  | 'pageMarginBounds'
  | 'showMargins'
  | 'onSelectLayer'
  | 'onHoverLayer'
  | 'onLayerDoubleClick'
  | 'onTransformChange'
  | 'onViewportChange'
  | 'viewportController'
  | 'canvasLayerInteractions'
  | 'stageInteraction'
>): CanvasStageController {
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [internalViewport] = useState(() => new ViewportController());
  const viewport = externalViewport ?? internalViewport;
  const [, setViewportTick] = useState(0);
  const [sizeLabelOffsetX, setSizeLabelOffsetX] = useState(0);
  const [selectionLabelBounds, setSelectionLabelBounds] =
    useState<SelectionBounds | null>(null);
  const [transformSessionLayerId, setTransformSessionLayerId] = useState<
    string | null
  >(null);
  const [activeDragAnchor, setActiveDragAnchor] = useState<string | null>(null);
  const transformSessionActiveRef = useRef(false);
  const transformerRef = useRef<Konva.Transformer>(null);
  const artboardGroupRef = useRef<Konva.Group>(null);
  const overlayGroupRef = useRef<Konva.Group>(null);
  const transformDragRef = useRef<TransformDragContext | null>(null);
  const richTextCornerSessionRef = useRef<RichTextCornerSession | null>(null);
  const cornerBakeRafRef = useRef<number | null>(null);
  const richTextBakeInProgressRef = useRef(false);
  const sizeLabelRef = useRef<Konva.Label>(null);
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());
  const dragSessionRef = useRef<DragSession | null>(null);
  const onSelectRef = useRef(onSelectLayer);
  const onHoverRef = useRef(onHoverLayer);
  const onDoubleClickRef = useRef(onLayerDoubleClick);
  const onTransformRef = useRef(onTransformChange);
  const onViewportRef = useRef(onViewportChange);
  const selectedLayerIdsRef = useRef(selectedLayerIds);
  const layersRef = useRef(layers);
  const stageInteractionRef = useRef<CanvasStageInteractionService | null>(
    stageInteraction
  );

  onSelectRef.current = onSelectLayer;
  onHoverRef.current = onHoverLayer;
  onDoubleClickRef.current = onLayerDoubleClick;
  onTransformRef.current = onTransformChange;
  onViewportRef.current = onViewportChange;
  selectedLayerIdsRef.current = selectedLayerIds;
  layersRef.current = layers;
  stageInteractionRef.current = stageInteraction;

  const lastReportedHoverRef = useRef<string | null>(null);

  const resolveHoveredLayerId = useCallback((stage: Konva.Stage | null) => {
    if (!stage) {
      return null;
    }
    const pos = stage.getPointerPosition();
    if (!pos) {
      return null;
    }
    const hit = stage.getIntersection(pos);
    let current: Konva.Node | null = hit;
    while (current) {
      const id = current.name();
      if (id && nodeRefs.current.has(id)) {
        return id;
      }
      current = current.parent;
    }
    return null;
  }, []);

  const handlePointerHover = useCallback(() => {
    const stage = artboardGroupRef.current?.getStage() ?? null;
    const nextId = resolveHoveredLayerId(stage);
    if (nextId === lastReportedHoverRef.current) {
      return;
    }
    lastReportedHoverRef.current = nextId;
    onHoverRef.current?.(nextId);
  }, [resolveHoveredLayerId]);

  const handlePointerLeave = useCallback(() => {
    if (lastReportedHoverRef.current === null) {
      return;
    }
    lastReportedHoverRef.current = null;
    onHoverRef.current?.(null);
  }, []);

  useEffect(() => {
    lastReportedHoverRef.current = hoveredLayerId;
  }, [hoveredLayerId]);

  const vp = viewport.getViewport();
  const selectedPrimary = selectedLayerIds[0] ?? null;
  const selectedLayerIdSet = useMemo(
    () => new Set(selectedLayerIds),
    [selectedLayerIds]
  );
  const artboardOffset = computeArtboardOffset(
    containerWidth,
    containerHeight,
    artboardWidth,
    artboardHeight,
    vp.zoom,
    vp.panX,
    vp.panY
  );

  const getMarginInset = useCallback(
    (): CanvasRect | null => (showMargins ? pageMarginBounds : null),
    [pageMarginBounds, showMargins]
  );

  const getOtherLayers = useCallback(
    (excludeIds: Set<string>): CanvasLayerTransformRef[] =>
      layersRef.current
        .filter(({ layer }) => !excludeIds.has(layer.id))
        .map(({ layer }) => ({
          layerType: layer.type,
          transform: layer.transform ?? createDefaultTransform(),
        })),
    []
  );

  const { clearOverlays, overlayPrimitives, setInteractionOverlays } =
    useCanvasOverlays({
      artboardHeight,
      artboardWidth,
      getMarginInset,
      showMargins,
      stageInteractionRef,
      zoom: vp.zoom,
    });

  const applyDragSnap = useCanvasDragSnap({
    artboardHeight,
    artboardWidth,
    dragSessionRef,
    getMarginInset,
    getOtherLayers,
    layersRef,
    nodeRefs,
    selectedLayerIdsRef,
    setInteractionOverlays,
    stageInteractionRef,
    zoom: vp.zoom,
  });

  const bumpViewport = useCallback(() => {
    const next = viewport.getViewport();
    onViewportRef.current?.(next.zoom);
    setViewportTick((value) => value + 1);
  }, [viewport]);

  useEffect(() => {
    onViewportRef.current?.(viewport.getViewport().zoom);
  }, [viewport]);

  useEffect(() => {
    if (!editingLayerId) {
      return;
    }
    const node = nodeRefs.current.get(editingLayerId);
    if (!node) {
      return;
    }
    node.destroyChildren();
    node.getLayer()?.batchDraw();
  }, [editingLayerId]);

  useEffect(() => {
    if (!transformerRef.current || editingLayerId) {
      transformerRef.current?.nodes([]);
      return;
    }
    const nodes = selectedLayerIds
      .map((layerId) => nodeRefs.current.get(layerId))
      .filter((node): node is Konva.Group => Boolean(node));
    attachTransformerToNodes(transformerRef.current, nodes);
  }, [editingLayerId, selectedLayerIds]);

  const selectedLayer = selectedPrimary
    ? layers.find(({ layer }) => layer.id === selectedPrimary)
    : null;
  const selectedTransform = selectedLayer?.layer.transform ?? null;
  const selectedInteraction = selectedLayer
    ? getInteraction(canvasLayerInteractions, selectedLayer.view.kind)
    : undefined;

  const isLayerSelectable = useCallback(
    (layer: SceneLayer) => isLayerEditable(layer),
    []
  );
  const isLayerWritableCallback = useCallback(
    (layer: SceneLayer) => isLayerWritable(layer),
    []
  );
  const isRichTextSelected = selectedInteraction?.kind === 'richText';
  const isRichTextSelectedRef = useRef(isRichTextSelected);
  isRichTextSelectedRef.current = isRichTextSelected;

  const updateSizeLabelImperatively = useCallback((bounds: SelectionBounds) => {
    const label = sizeLabelRef.current;
    if (!label) {
      return;
    }
    label.position({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height + 6,
    });
    const text = label.findOne('Text') as Konva.Text | undefined;
    text?.text(`${Math.round(bounds.width)} × ${Math.round(bounds.height)} px`);
    label.getLayer()?.batchDraw();
  }, []);

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

    if (
      selectedPrimary &&
      selectedInteraction?.kind === 'richText' &&
      selectedLayer &&
      node
    ) {
      setTransformSessionLayerId(selectedPrimary);
      startRichTextTransform(
        createRichTextTransformRuntime(
          selectedPrimary,
          selectedLayer.view as Extract<
            LayerPreviewDescriptor,
            { kind: 'richText' }
          >,
          selectedLayer.layer.transform,
          node,
          transformer ?? null,
          activeAnchor,
          {
            bakeInProgressRef: richTextBakeInProgressRef,
            cornerBakeRafRef,
            dragRef: transformDragRef,
            nodeRefs: nodeRefs.current,
            onUpdateSizeLabel: updateSizeLabelImperatively,
            sessionRef: richTextCornerSessionRef,
          }
        )
      );
    } else {
      transformDragRef.current = transformer
        ? createTransformDragContext(transformer)
        : null;
    }
  }, [
    selectedInteraction?.kind,
    selectedLayer,
    selectedPrimary,
    updateSizeLabelImperatively,
  ]);

  const handleTransformEnd = useCallback(() => {
    transformSessionActiveRef.current = false;
    setTransformSessionLayerId(null);
    setActiveDragAnchor(null);
    clearOverlays();
    applyTransformerAnchorVisibility(
      transformerRef.current,
      null,
      isRichTextSelectedRef.current ? [...RICH_TEXT_ENABLED_ANCHORS] : null
    );
    transformDragRef.current = null;
    endRichTextTransformSession({
      cornerBakeRafRef,
      sessionRef: richTextCornerSessionRef,
    });
  }, [clearOverlays]);

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

  const syncLabelFromTransformer = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer || transformer.nodes().length === 0) {
      return;
    }
    const rect = transformer.getClientRect();
    setSelectionLabelBounds({
      height: rect.height / vp.zoom,
      width: rect.width / vp.zoom,
      x: (rect.x - artboardOffset.x) / vp.zoom,
      y: (rect.y - artboardOffset.y) / vp.zoom,
    });
  }, [artboardOffset.x, artboardOffset.y, vp.zoom]);

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
      const session = richTextCornerSessionRef.current;
      const anchor = transformDragRef.current?.anchor ?? '';
      let nextBox = newBox;
      if (session && isRichTextHorizontalAnchor(anchor)) {
        nextBox = boundRichTextBox(
          session,
          anchor,
          oldBox,
          newBox,
          (() => {
            const transformer = transformerRef.current;
            const stage = transformer?.getStage();
            const node = transformer?.nodes()[0] as Konva.Group | undefined;
            const parent = node?.getParent();
            if (!stage || !parent) {
              return null;
            }
            const pointer = stage.getPointerPosition();
            if (!pointer) {
              return null;
            }
            return parent.getAbsoluteTransform().copy().invert().point(pointer);
          })()
        );
      }

      if (!anchor || anchor === 'rotater') {
        return nextBox;
      }

      const adjusted = interaction?.adjustResize?.({
        anchor,
        artboard: { height: artboardHeight, width: artboardWidth },
        box: nextBox,
        marginInset: getMarginInset(),
        others: getOtherLayers(new Set(selectedLayerIdsRef.current)),
        zoom: vp.zoom,
      });
      if (adjusted) {
        setInteractionOverlays(adjusted.overlays);
      }
      return adjusted?.box ?? nextBox;
    },
    [
      artboardHeight,
      artboardWidth,
      getMarginInset,
      getOtherLayers,
      setInteractionOverlays,
      vp.zoom,
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
      runRichTextLiveBake(
        createRichTextTransformRuntime(
          layerId,
          view,
          layers.find(({ layer }) => layer.id === layerId)?.layer.transform,
          node,
          transformerRef.current,
          transformDragRef.current?.anchor ?? null,
          {
            bakeInProgressRef: richTextBakeInProgressRef,
            cornerBakeRafRef,
            dragRef: transformDragRef,
            nodeRefs: nodeRefs.current,
            onUpdateSizeLabel: updateSizeLabelImperatively,
            sessionRef: richTextCornerSessionRef,
          }
        )
      );
    },
    [layers, updateSizeLabelImperatively]
  );

  useEffect(() => {
    if (!selectedTransform) {
      setSelectionLabelBounds(null);
      return;
    }
    setSelectionLabelBounds({
      height: selectedTransform.height,
      width: selectedTransform.width,
      x: selectedTransform.x,
      y: selectedTransform.y,
    });
  }, [selectedTransform]);

  useLayoutEffect(() => {
    if (
      !selectedPrimary ||
      !selectedTransform ||
      transformSessionActiveRef.current
    ) {
      return;
    }
    const nodes = selectedLayerIds
      .map((layerId) => nodeRefs.current.get(layerId))
      .filter((node): node is Konva.Group => Boolean(node));
    attachTransformerToNodes(transformerRef.current, nodes);
    syncLabelFromTransformer();
  }, [
    selectedLayerIds,
    selectedPrimary,
    selectedTransform,
    syncLabelFromTransformer,
  ]);

  useEffect(() => {
    if (!selectedPrimary) {
      return;
    }
    requestAnimationFrame(() => {
      syncLabelFromTransformer();
    });
  }, [selectedPrimary, syncLabelFromTransformer]);

  const sizeLabelText = selectionLabelBounds
    ? `${Math.round(selectionLabelBounds.width)} × ${Math.round(selectionLabelBounds.height)} px`
    : '';

  useLayoutEffect(() => {
    const label = sizeLabelRef.current;
    if (!label) {
      return;
    }
    const nextOffsetX = label.width() / 2;
    setSizeLabelOffsetX((current) =>
      current === nextOffsetX ? current : nextOffsetX
    );
  }, [sizeLabelText]);

  const handleLayerTransform = useCallback(
    (
      layerId: string,
      node: Konva.Group,
      view: LayerPreviewDescriptor,
      interactionKind: string | undefined
    ) => {
      if (
        interactionKind === 'richText' &&
        layerId === selectedLayerIdsRef.current[0]
      ) {
        if (!transformDragRef.current && transformerRef.current) {
          transformDragRef.current = createTransformDragContext(
            transformerRef.current
          );
        }
        scheduleRichTextLiveBake(
          layerId,
          view as Extract<LayerPreviewDescriptor, { kind: 'richText' }>
        );
      } else if (layerId === selectedLayerIdsRef.current[0]) {
        updateResizeGuides();
        syncLabelFromTransformer();
      }
    },
    [scheduleRichTextLiveBake, syncLabelFromTransformer, updateResizeGuides]
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

      if (interactionKind === 'richText') {
        const baked = bakeRichTextTransformEnd(
          createRichTextTransformRuntime(
            layerId,
            view as Extract<LayerPreviewDescriptor, { kind: 'richText' }>,
            transform,
            node,
            transformerRef.current,
            transformDragRef.current?.anchor ?? null,
            {
              bakeInProgressRef: richTextBakeInProgressRef,
              cornerBakeRafRef,
              dragRef: transformDragRef,
              nodeRefs: nodeRefs.current,
              onUpdateSizeLabel: updateSizeLabelImperatively,
              sessionRef: richTextCornerSessionRef,
            }
          ),
          node
        );
        if (baked) {
          nextTransform = baked.transform;
          nextFontSize = baked.fontSize;
        }
      }

      handleTransformEnd();
      onTransformRef.current?.(layerId, {
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
    [handleTransformEnd, syncLabelFromTransformer, updateSizeLabelImperatively]
  );

  const interactionAnchors = selectedInteraction?.enabledAnchors?.();
  const transformerEnabledAnchors = activeDragAnchor
    ? activeDragAnchor === 'rotater'
      ? []
      : [activeDragAnchor]
    : interactionAnchors
      ? [...interactionAnchors]
      : undefined;

  return {
    stageContainerRef,
    viewport,
    vp,
    artboardOffset,
    artboardGroupRef,
    overlayGroupRef,
    transformerRef,
    sizeLabelRef,
    nodeRefs,
    selectedPrimary,
    selectedLayerIdSet,
    selectedLayerIds,
    selectedTransform,
    selectedInteraction,
    editingLayerId,
    transformSessionLayerId,
    overlayPrimitives,
    selectionLabelBounds,
    sizeLabelOffsetX,
    sizeLabelText,
    activeDragAnchor,
    transformerEnabledAnchors,
    isLayerSelectable,
    isLayerWritableCallback,
    onSelectRef,
    onDoubleClickRef,
    onTransformRef,
    layersRef,
    dragSessionRef,
    bumpViewport,
    clearOverlays,
    applyDragSnap,
    handleTransformStart,
    handleTransformEnd,
    anchorDragBoundFunc,
    boundBoxFunc,
    syncLabelFromTransformer,
    handlePointerHover,
    handlePointerLeave,
    scheduleRichTextLiveBake,
    updateResizeGuides,
    handleLayerTransform,
    completeLayerTransform,
  };
}
