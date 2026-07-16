import { canSelectLayer, canTransformLayer } from '@openenvx/core';
import { useStoreSelector } from '@openenvx/headless/react';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import type { Transform } from '@openenvx/schema';
import type Konva from 'konva';
import { memo, useCallback } from 'react';
import { Group, Rect } from 'react-konva';

import { CanvasLayerContent } from './canvas-layer-content';
import type { CanvasStageLayer } from './canvas-stage-types';
import { getInteraction } from './canvas-transformer-utils';
import { CANVAS_GROUP_LAYER_TYPE } from './layers/canvas-group-layer';
import type {
  CanvasLayerInteractionRegistration,
  CanvasLayerRendererRegistration,
} from './registry/canvas-registry-types';
import type { CanvasStageRuntime } from './stage/canvas-stage-runtime';
import {
  selectLayerSlice,
  shallowSliceEqual,
} from './stage/canvas-stage-selectors';
import { DEFAULT_TRANSFORM } from './stage/default-transform';

function tryActivateLayerInteraction(input: {
  interaction: CanvasLayerInteractionRegistration | undefined;
  layerId: string;
  layerWritable: boolean;
  runtime: CanvasStageRuntime;
  transform: Transform;
  view: LayerPreviewDescriptor;
}): boolean {
  const { interaction, layerId, layerWritable, runtime, transform, view } =
    input;
  if (!interaction?.opensEditorOnReselect?.(view) || !layerWritable) {
    return false;
  }
  const node = runtime.nodeRefs.current?.get(layerId);
  if (!node) {
    return false;
  }
  interaction.onLayerActivate?.({
    layerId,
    node,
    transform,
    view,
  });
  runtime.enterInteractionPreview(layerId);
  return true;
}

export interface CanvasStageLayerGroupProps {
  entry: CanvasStageLayer;
  runtime: CanvasStageRuntime;
  selectedPrimary: string | null;
  editingLayerId: string | null;
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  fontLoadRevision: number;
}

export const CanvasStageLayerGroup = memo(function CanvasStageLayerGroup({
  entry,
  runtime,
  selectedPrimary,
  editingLayerId,
  canvasLayerRenderers,
  canvasLayerInteractions,
  fontLoadRevision,
}: CanvasStageLayerGroupProps) {
  const { layer, view, children } = entry;
  const baseTransform = layer.transform ?? DEFAULT_TRANSFORM;
  const interaction = getInteraction(canvasLayerInteractions, view.kind);
  const layerWritable = canTransformLayer(layer);
  const layerSelectable = canSelectLayer(layer);
  const layerVisible = layer.visible !== false;

  const slice = useStoreSelector(
    runtime,
    (snapshot) =>
      selectLayerSlice(
        snapshot,
        layer.id,
        baseTransform,
        interaction,
        editingLayerId,
        layerWritable,
        layerVisible
      ),
    shallowSliceEqual
  );

  const { transform, hideContent, draggable, visible } = slice ?? {
    draggable: false,
    hideContent: false,
    transform: baseTransform,
    visible: true,
  };

  const isGroupLayer = layer.type === CANVAS_GROUP_LAYER_TYPE;

  const handleClick = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent>) => {
      event.cancelBubble = true;
      if (!layerSelectable) {
        return;
      }
      if (
        interaction?.usesEditOverlay &&
        layer.id === selectedPrimary &&
        editingLayerId !== layer.id &&
        layerWritable
      ) {
        runtime.openLayerEditor(layer.id);
        return;
      }
      if (
        layer.id === selectedPrimary &&
        tryActivateLayerInteraction({
          interaction,
          layerId: layer.id,
          layerWritable,
          runtime,
          transform,
          view,
        })
      ) {
        return;
      }
      const additive =
        event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey;
      runtime.selectLayer(layer.id, { additive });
    },
    [
      editingLayerId,
      interaction,
      layer.id,
      layerSelectable,
      layerWritable,
      runtime,
      selectedPrimary,
      transform,
      view,
    ]
  );

  const handleContextMenu = useCallback(() => {
    if (!layerSelectable) {
      return;
    }
    runtime.selectLayer(layer.id);
  }, [layer.id, layerSelectable, runtime]);

  const handleDblClick = useCallback(() => {
    if (!layerSelectable || !layerWritable) {
      return;
    }
    if (interaction?.usesEditOverlay) {
      runtime.openLayerEditor(layer.id);
    } else {
      tryActivateLayerInteraction({
        interaction,
        layerId: layer.id,
        layerWritable,
        runtime,
        transform,
        view,
      });
    }
    interaction?.onDoubleClick?.(layer.id);
  }, [
    interaction,
    layer.id,
    layerSelectable,
    layerWritable,
    runtime,
    transform,
    view,
  ]);

  const handleDragStart = useCallback(() => {
    runtime.onLayerDragStart(layer.id);
  }, [layer.id, runtime]);

  const handleDragMove = useCallback(
    (event: Konva.KonvaEventObject<DragEvent>) => {
      runtime.onLayerDragMove(layer.id, event.target as Konva.Group, transform);
    },
    [layer.id, runtime, transform]
  );

  const handleDragEnd = useCallback(() => {
    runtime.onLayerDragEnd(layer.id);
  }, [layer.id, runtime]);

  const handleTransform = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      runtime.onLayerTransform(
        layer.id,
        event.target as Konva.Group,
        view,
        interaction?.kind,
        layerWritable
      );
    },
    [interaction?.kind, layer.id, layerWritable, runtime, view]
  );

  const handleTransformEnd = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      runtime.onLayerTransformEnd({
        interactionKind: interaction?.kind,
        layerId: layer.id,
        node: event.target as Konva.Group,
        transform: baseTransform,
        view,
        writable: layerWritable,
      });
    },
    [baseTransform, interaction?.kind, layer.id, layerWritable, runtime, view]
  );

  return (
    <Group
      draggable={draggable}
      height={transform.height}
      key={layer.id}
      listening={layerVisible}
      name={layer.id}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      onDragStart={handleDragStart}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
      opacity={transform.opacity}
      ref={runtime.getRegisterNode(layer.id)}
      rotation={transform.rotation}
      visible={visible}
      width={transform.width}
      x={transform.x}
      y={transform.y}
    >
      {isGroupLayer ? (
        <Rect
          dash={[6, 4]}
          height={transform.height}
          listening={true}
          stroke="#6366f1"
          strokeWidth={1}
          width={transform.width}
        />
      ) : (
        <CanvasLayerContent
          canvasLayerRenderers={canvasLayerRenderers}
          fontLoadRevision={fontLoadRevision}
          height={transform.height}
          hidden={hideContent}
          view={view}
          width={transform.width}
        />
      )}
      {children?.map((childEntry) => (
        <CanvasStageLayerGroup
          canvasLayerInteractions={canvasLayerInteractions}
          canvasLayerRenderers={canvasLayerRenderers}
          editingLayerId={editingLayerId}
          entry={childEntry}
          fontLoadRevision={fontLoadRevision}
          key={childEntry.layer.id}
          runtime={runtime}
          selectedPrimary={selectedPrimary}
        />
      ))}
    </Group>
  );
});
