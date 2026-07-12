import { createDefaultTransform } from '@openenvx/schema';
import type Konva from 'konva';
import { Group } from 'react-konva';

import { CanvasLayerContent } from './canvas-layer-content';
import type { CanvasStageLayer } from './canvas-stage-types';
import { getInteraction } from './canvas-transformer-utils';
import type { CanvasStageController } from './hooks/use-canvas-stage-controller';
import type {
  CanvasLayerInteractionRegistration,
  CanvasLayerRendererRegistration,
} from './registry/canvas-registry-types';

export interface CanvasStageLayerGroupProps {
  entry: CanvasStageLayer;
  controller: CanvasStageController;
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  fontLoadRevision: number;
}

export function CanvasStageLayerGroup({
  entry,
  controller,
  canvasLayerRenderers,
  canvasLayerInteractions,
  fontLoadRevision,
}: CanvasStageLayerGroupProps) {
  const { layer, view } = entry;
  const transform = layer.transform ?? createDefaultTransform();
  const interaction = getInteraction(canvasLayerInteractions, view.kind);
  const {
    editingLayerId,
    transformSessionLayerId,
    selectedPrimary,
    selectedLayerIds,
    selectedLayerIdSet,
    isLayerSelectable,
    isLayerWritableCallback,
    onSelectRef,
    onDoubleClickRef,
    nodeRefs,
    dragSessionRef,
    layersRef,
    onTransformRef,
    applyDragSnap,
    clearOverlays,
    syncLabelFromTransformer,
    handleLayerTransform,
    completeLayerTransform,
  } = controller;

  const isEditing = editingLayerId === layer.id;
  const isImperativeTransformTarget =
    transformSessionLayerId === layer.id &&
    interaction?.hideContentDuringTransform?.(layer.id) === true;
  const isHiddenDuringEdit =
    interaction?.hideContentDuringEdit?.(editingLayerId, layer.id) ?? false;
  const layerSelectable = isLayerSelectable(layer);
  const layerWritable = isLayerWritableCallback(layer);
  const isGroupDragTarget =
    selectedLayerIdSet.has(layer.id) && selectedLayerIds.length > 1;

  return (
    <Group
      draggable={!isEditing && layerWritable}
      height={transform.height}
      key={layer.id}
      listening={true}
      name={layer.id}
      onClick={(event) => {
        if (!layerSelectable) {
          return;
        }
        if (
          interaction?.usesEditOverlay &&
          layer.id === selectedPrimary &&
          editingLayerId !== layer.id &&
          layerWritable
        ) {
          onDoubleClickRef.current?.(layer.id);
          return;
        }
        const additive =
          event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey;
        onSelectRef.current(layer.id, { additive });
      }}
      onContextMenu={() => {
        if (!layerSelectable) {
          return;
        }
        onSelectRef.current(layer.id);
      }}
      onDblClick={() => {
        if (!layerSelectable || !layerWritable) {
          return;
        }
        if (interaction?.usesEditOverlay) {
          onDoubleClickRef.current?.(layer.id);
        }
      }}
      onDragEnd={() => {
        if (!layerWritable) {
          return;
        }
        const session = dragSessionRef.current;
        const movedIds =
          session && session.layerId === layer.id && isGroupDragTarget
            ? selectedLayerIds
            : [layer.id];
        for (const movedId of movedIds) {
          const node = nodeRefs.current?.get(movedId);
          const movedLayer = layersRef.current?.find(
            (item) => item.layer.id === movedId
          )?.layer;
          if (!node || !movedLayer) {
            continue;
          }
          const movedTransform =
            movedLayer.transform ?? createDefaultTransform();
          onTransformRef.current?.(movedId, {
            transform: {
              ...movedTransform,
              x: node.x(),
              y: node.y(),
            },
          });
        }
        dragSessionRef.current = null;
        clearOverlays();
        if (selectedLayerIds.includes(layer.id)) {
          syncLabelFromTransformer();
        }
      }}
      onDragMove={(event) => {
        applyDragSnap(layer.id, event.target as Konva.Group, transform);
        if (selectedLayerIds.includes(layer.id)) {
          syncLabelFromTransformer();
        }
      }}
      onDragStart={() => {
        if (!selectedLayerIdSet.has(layer.id) || selectedLayerIds.length <= 1) {
          dragSessionRef.current = null;
          return;
        }
        const starts = new Map<string, { x: number; y: number }>();
        for (const id of selectedLayerIds) {
          const node = nodeRefs.current?.get(id);
          if (!node) {
            continue;
          }
          starts.set(id, { x: node.x(), y: node.y() });
        }
        dragSessionRef.current = { layerId: layer.id, starts };
      }}
      onTransform={(event) => {
        if (!layerWritable) {
          return;
        }
        handleLayerTransform(
          layer.id,
          event.target as Konva.Group,
          view,
          interaction?.kind
        );
      }}
      onTransformEnd={(event) => {
        if (!layerWritable) {
          return;
        }
        completeLayerTransform({
          interactionKind: interaction?.kind,
          layerId: layer.id,
          node: event.target as Konva.Group,
          transform,
          view,
        });
      }}
      opacity={transform.opacity}
      ref={(node) => {
        if (!nodeRefs.current) {
          return;
        }
        if (node) {
          nodeRefs.current.set(layer.id, node);
        } else {
          nodeRefs.current.delete(layer.id);
        }
      }}
      rotation={transform.rotation}
      visible={!isEditing}
      width={transform.width}
      x={transform.x}
      y={transform.y}
    >
      <CanvasLayerContent
        canvasLayerRenderers={canvasLayerRenderers}
        fontLoadRevision={fontLoadRevision}
        height={transform.height}
        hidden={isHiddenDuringEdit || isImperativeTransformTarget}
        view={view}
        width={transform.width}
      />
    </Group>
  );
}
