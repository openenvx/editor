import { useLayoutEffect, useMemo } from 'react';
import {
  Group,
  Label,
  Layer,
  Rect,
  Stage,
  Tag,
  Text,
  Transformer,
} from 'react-konva';

import { CanvasHoverOutline } from './canvas-hover-outline';
import { CanvasStageLayerGroup } from './canvas-stage-layer';
import {
  EMPTY_CANVAS_LAYER_INTERACTIONS,
  EMPTY_CANVAS_LAYER_RENDERERS,
} from './canvas-stage-types';
import type { CanvasStageProps } from './canvas-stage-types';
import { flattenStageLayers } from './flatten-layer-surface';
import { useCanvasStageController } from './hooks/use-canvas-stage-controller';
import { syncCanvasOverlays } from './stage/canvas-overlay-sync';
import { useCanvasThemeColors } from './use-canvas-theme-colors';
import {
  computeWheelZoom,
  isWheelZoomGesture,
  normalizeWheelDeltaY,
} from './viewport';

export type {
  CanvasSelectLayerOptions,
  CanvasStageLayer,
  CanvasStageProps,
  CanvasTransformChange,
} from './canvas-stage-types';

export function CanvasStage({
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
  onSelectLayer,
  onHoverLayer,
  onLayerDoubleClick,
  onTransformChange,
  onViewportChange,
  viewportController,
  canvasLayerRenderers = EMPTY_CANVAS_LAYER_RENDERERS,
  canvasLayerInteractions = EMPTY_CANVAS_LAYER_INTERACTIONS,
  stageInteraction = null,
  fontLoadRevision = 0,
}: CanvasStageProps) {
  const controller = useCanvasStageController({
    artboardHeight,
    artboardWidth,
    canvasLayerInteractions,
    containerHeight,
    containerWidth,
    editingLayerId,
    layers,
    onLayerDoubleClick,
    onSelectLayer,
    onHoverLayer,
    onTransformChange,
    onViewportChange,
    pageMarginBounds,
    selectedLayerIds,
    primaryLayerId,
    hoveredLayerId,
    showMargins,
    stageInteraction,
    viewportController,
  });

  const {
    stageContainerRef,
    viewport,
    vp,
    artboardOffset,
    artboardGroupRef,
    overlayGroupRef,
    transformerRef,
    sizeLabelRef,
    onSelectRef,
    bumpViewport,
    overlayPrimitives,
    editingLayerId: activeEditingLayerId,
    selectedLayerIdSet,
    selectionLabelBounds,
    sizeLabelOffsetX,
    sizeLabelText,
    activeDragAnchor,
    transformerEnabledAnchors,
    handleTransformStart,
    anchorDragBoundFunc,
    boundBoxFunc,
    syncLabelFromTransformer,
    handlePointerHover,
    handlePointerLeave,
  } = controller;

  const themeColors = useCanvasThemeColors(stageContainerRef);

  const flattenedLayers = useMemo(() => flattenStageLayers(layers), [layers]);

  const hoveredEntry = useMemo(() => {
    if (
      activeEditingLayerId ||
      !hoveredLayerId ||
      selectedLayerIdSet.has(hoveredLayerId)
    ) {
      return null;
    }
    return (
      flattenedLayers.find((entry) => entry.layer.id === hoveredLayerId) ?? null
    );
  }, [
    activeEditingLayerId,
    flattenedLayers,
    hoveredLayerId,
    selectedLayerIdSet,
  ]);

  useLayoutEffect(() => {
    const group = overlayGroupRef.current;
    if (!group) {
      return;
    }
    syncCanvasOverlays(group, overlayPrimitives, {
      foreground: themeColors.foreground,
      guideStroke: themeColors.smartGuide,
      marginStroke: themeColors.pageMargin,
    });
  }, [overlayGroupRef, overlayPrimitives, themeColors]);

  if (containerWidth <= 0 || containerHeight <= 0) {
    return null;
  }

  return (
    <div
      onMouseLeave={handlePointerLeave}
      ref={stageContainerRef}
      style={{ width: '100%', height: '100%' }}
    >
      <Stage
        height={containerHeight}
        onContextMenu={(event) => {
          if (event.target === event.target.getStage()) {
            onSelectRef.current('');
          }
        }}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            onSelectRef.current('');
          }
        }}
        onMouseMove={handlePointerHover}
        onWheel={(event) => {
          event.evt.preventDefault();
          const { ctrlKey, deltaMode, deltaX, deltaY } = event.evt;
          const layout = {
            artboardHeight,
            artboardWidth,
            containerHeight,
            containerWidth,
          };

          if (isWheelZoomGesture(ctrlKey, deltaMode)) {
            const pointer = event.target.getStage()?.getPointerPosition();
            const normalizedDeltaY = normalizeWheelDeltaY(
              deltaY,
              deltaMode,
              containerHeight
            );
            const nextZoom = computeWheelZoom(vp.zoom, normalizedDeltaY);
            if (pointer) {
              viewport.zoomAtPointer(pointer.x, pointer.y, nextZoom, layout);
            } else {
              viewport.setZoom(nextZoom);
            }
          } else {
            viewport.pan(-deltaX, -deltaY);
          }

          bumpViewport();
        }}
        width={containerWidth}
      >
        <Layer>
          <Group
            ref={artboardGroupRef}
            scaleX={vp.zoom}
            scaleY={vp.zoom}
            x={artboardOffset.x}
            y={artboardOffset.y}
          >
            <Rect
              fill={themeColors.artboard}
              height={artboardHeight}
              listening={false}
              width={artboardWidth}
              x={0}
              y={0}
            />
            <Group
              clipHeight={artboardHeight}
              clipWidth={artboardWidth}
              clipX={0}
              clipY={0}
            >
              {layers.map((entry) => (
                <CanvasStageLayerGroup
                  canvasLayerInteractions={canvasLayerInteractions}
                  canvasLayerRenderers={canvasLayerRenderers}
                  controller={controller}
                  entry={entry}
                  fontLoadRevision={fontLoadRevision}
                  key={entry.layer.id}
                />
              ))}
              <Group listening={false} ref={overlayGroupRef} />
            </Group>
            {!activeEditingLayerId ? (
              <Transformer
                anchorDragBoundFunc={anchorDragBoundFunc}
                borderStroke={themeColors.selection}
                boundBoxFunc={boundBoxFunc}
                enabledAnchors={transformerEnabledAnchors}
                flipEnabled={false}
                onTransformEnd={() => {
                  syncLabelFromTransformer();
                }}
                onTransformStart={() => {
                  handleTransformStart();
                }}
                ref={transformerRef}
                rotateEnabled={
                  !activeDragAnchor || activeDragAnchor === 'rotater'
                }
              />
            ) : null}
            {hoveredEntry ? (
              <CanvasHoverOutline
                entry={hoveredEntry}
                stroke={themeColors.selection}
              />
            ) : null}
            {selectionLabelBounds ? (
              <Label
                listening={false}
                offsetX={sizeLabelOffsetX}
                ref={sizeLabelRef}
                x={selectionLabelBounds.x + selectionLabelBounds.width / 2}
                y={selectionLabelBounds.y + selectionLabelBounds.height + 6}
              >
                <Tag
                  cornerRadius={4}
                  fill={themeColors.selection}
                  lineJoin="round"
                  pointerDirection="up"
                  pointerHeight={4}
                  pointerWidth={8}
                />
                <Text
                  fill={themeColors.foreground}
                  fontFamily="Geist Mono, ui-monospace, monospace"
                  fontSize={11}
                  padding={6}
                  text={sizeLabelText}
                />
              </Label>
            ) : null}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
