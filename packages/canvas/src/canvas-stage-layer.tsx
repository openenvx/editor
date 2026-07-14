import { createDefaultTransform } from '@openenvx/schema';
import type Konva from 'konva';
import type { RefObject } from 'react';
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

function tryActivateLayerInteraction(input: {
  interaction: CanvasLayerInteractionRegistration | undefined;
  layerId: string;
  layerWritable: boolean;
  runtime: CanvasStageRuntime;
  transform: import('@openenvx/schema').Transform;
  view: unknown;
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
  runtime.enterInteractionPreview(layerId);
  interaction.onLayerActivate?.({
    layerId,
    node,
    transform,
    view,
  });
  return true;
}

export interface CanvasStageLayerGroupProps {
  entry: CanvasStageLayer;
  runtimeRef: RefObject<CanvasStageRuntime | null>;
  selectedLayerIds: string[];
  primaryLayerId: string | null;
  editingLayerId: string | null;
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  fontLoadRevision: number;
}

export function CanvasStageLayerGroup({
  entry,
  runtimeRef,
  selectedLayerIds,
  primaryLayerId,
  editingLayerId,
  canvasLayerRenderers,
  canvasLayerInteractions,
  fontLoadRevision,
}: CanvasStageLayerGroupProps) {
  const runtime = runtimeRef.current;
  const { layer, view, children } = entry;
  const baseTransform = layer.transform ?? createDefaultTransform();
  const transform =
    runtime?.getLayerTransform(layer.id, baseTransform) ?? baseTransform;
  const interaction = getInteraction(canvasLayerInteractions, view.kind);

  const selectedPrimary = primaryLayerId ?? selectedLayerIds[0] ?? null;
  const selectedLayerIdSet = new Set(selectedLayerIds);
  const transformSessionLayerId = runtime?.getTransformSessionLayerId() ?? null;

  const isGroupLayer = layer.type === CANVAS_GROUP_LAYER_TYPE;
  const isEditing = editingLayerId === layer.id;
  const interactionPreviewLayerId =
    runtime?.getInteractionPreviewLayerId() ?? null;
  const isImperativeTransformTarget =
    transformSessionLayerId === layer.id &&
    interaction?.hideContentDuringTransform?.(layer.id) === true;
  const isInteractionPreviewTarget =
    interactionPreviewLayerId === layer.id &&
    interaction?.hideContentDuringTransform?.(layer.id) === true;
  const hideImperativeContent =
    isImperativeTransformTarget || isInteractionPreviewTarget;
  const isHiddenDuringEdit =
    interaction?.hideContentDuringEdit?.(editingLayerId, layer.id) ?? false;
  const layerSelectable = runtime?.isLayerSelectable(layer) ?? false;
  const layerWritable = runtime?.isLayerWritable(layer) ?? false;

  return (
    <Group
      draggable={!isEditing && layerWritable && !isImperativeTransformTarget}
      height={transform.height}
      key={layer.id}
      listening={true}
      name={layer.id}
      onClick={(event) => {
        event.cancelBubble = true;
        if (!runtime || !layerSelectable) {
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
      }}
      onContextMenu={() => {
        if (!runtime || !layerSelectable) {
          return;
        }
        runtime.selectLayer(layer.id);
      }}
      onDblClick={() => {
        if (!runtime || !layerSelectable || !layerWritable) {
          return;
        }
        if (interaction?.usesEditOverlay) {
          runtime.openLayerEditor(layer.id);
          return;
        }
        tryActivateLayerInteraction({
          interaction,
          layerId: layer.id,
          layerWritable,
          runtime,
          transform,
          view,
        });
      }}
      onDragEnd={() => {
        if (!runtime || !layerWritable) {
          return;
        }
        runtime.onLayerDragEnd(layer.id, selectedLayerIds, selectedLayerIdSet);
      }}
      onDragMove={(event) => {
        if (!runtime) {
          return;
        }
        runtime.onLayerDragMove(
          layer.id,
          event.target as Konva.Group,
          transform,
          selectedLayerIds
        );
      }}
      onDragStart={() => {
        if (!runtime) {
          return;
        }
        runtime.onLayerDragStart(
          layer.id,
          selectedLayerIds,
          selectedLayerIdSet
        );
      }}
      onTransform={(event) => {
        if (!runtime) {
          return;
        }
        runtime.onLayerTransform(
          layer.id,
          event.target as Konva.Group,
          view,
          interaction?.kind,
          layerWritable
        );
      }}
      onTransformEnd={(event) => {
        if (!runtime) {
          return;
        }
        runtime.onLayerTransformEnd({
          interactionKind: interaction?.kind,
          layerId: layer.id,
          node: event.target as Konva.Group,
          transform: baseTransform,
          view,
          writable: layerWritable,
        });
      }}
      opacity={transform.opacity}
      ref={(node) => {
        runtime?.registerNode(layer.id, node);
      }}
      rotation={transform.rotation}
      visible={!isEditing}
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
          hidden={isHiddenDuringEdit || hideImperativeContent}
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
          primaryLayerId={primaryLayerId}
          runtimeRef={runtimeRef}
          selectedLayerIds={selectedLayerIds}
        />
      ))}
    </Group>
  );
}
