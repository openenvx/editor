import { canSelectLayer, canTransformLayer } from '@openenvx/core';
import { useStoreSelector } from '@openenvx/headless/react';
import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import type { Transform } from '@xmazu/openenvxee-schema';
import type Konva from 'konva';
import { memo, useCallback, useRef } from 'react';
import { Group, Rect } from 'react-konva';

import { CanvasLayerContent } from './canvas-layer-content';
import type { CanvasStageLayer } from './canvas-stage-types';
import { getInteraction } from './canvas-transformer-utils';
import { emitOpenEnvxWidgetClick } from './interactions/widget-click-handler';
import { CANVAS_GROUP_LAYER_TYPE } from './layers/canvas-group-layer';
import { isCanvasContainerLayerType } from './layers/is-canvas-container-layer';
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

/** Pixels before a mousedown on container content becomes a container drag. */
const CONTAINER_DRAG_THRESHOLD_PX = 3;

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
  selectedLayerIdSet: Set<string>;
  editingLayerId: string | null;
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  fontLoadRevision: number;
}

export const CanvasStageLayerGroup = memo(function CanvasStageLayerGroup({
  entry,
  runtime,
  selectedPrimary,
  selectedLayerIdSet,
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
  const isSelected = selectedLayerIdSet.has(layer.id);

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
        layerVisible,
        isSelected
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
  const isContainerLayer = isCanvasContainerLayerType(layer.type);
  const containerDragCleanupRef = useRef<(() => void) | null>(null);

  const handleClick = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent>) => {
      event.cancelBubble = true;
      // Always notify the widget bridge — host no-ops when the target is not
      // under an openenvx.widget (or is the widget itself with no handler).
      emitOpenEnvxWidgetClick(layer.id);
      interaction?.onClick?.(layer.id);
      if (!layerSelectable) {
        // Locked face child: select the widget (or other selectable) ancestor
        // so the envelope transformer tracks the composed object.
        let ancestor: Konva.Node | null = event.target.getParent();
        while (ancestor) {
          const ancestorId = ancestor.name?.() ?? '';
          if (ancestorId && ancestorId !== layer.id) {
            const ancestorEntry = runtime.layersRef.current.find(
              (item) => item.layer.id === ancestorId
            );
            if (ancestorEntry && canSelectLayer(ancestorEntry.layer)) {
              runtime.selectLayer(ancestorId);
              break;
            }
          }
          ancestor = ancestor.getParent();
        }
        return;
      }

      const additive =
        event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey;

      // Click targets the layer under the pointer (child or container). Groups
      // and widgets move as a unit only when the container itself is selected.
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

  /**
   * Only the selected node is `draggable`. When a group/widget is selected,
   * mousedown lands on children (not the container), so Konva never starts the
   * parent drag — forward it after a small move threshold so a plain click can
   * still select the child.
   */
  const handleMouseDown = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      containerDragCleanupRef.current?.();
      containerDragCleanupRef.current = null;

      if (!(isContainerLayer && isSelected && draggable)) {
        return;
      }

      const container = event.currentTarget as Konva.Group;
      const stage = container.getStage();
      const start = stage?.getPointerPosition();
      if (!stage || !start) {
        return;
      }

      const thresholdSq =
        CONTAINER_DRAG_THRESHOLD_PX * CONTAINER_DRAG_THRESHOLD_PX;

      const onMove = () => {
        const pos = stage.getPointerPosition();
        if (!pos) {
          return;
        }
        const dx = pos.x - start.x;
        const dy = pos.y - start.y;
        if (dx * dx + dy * dy < thresholdSq) {
          return;
        }
        cleanup();
        if (!container.isDragging()) {
          container.startDrag();
        }
      };

      const cleanup = () => {
        stage.off('mousemove', onMove);
        stage.off('touchmove', onMove);
        stage.off('mouseup', cleanup);
        stage.off('touchend', cleanup);
        containerDragCleanupRef.current = null;
      };

      containerDragCleanupRef.current = cleanup;
      stage.on('mousemove', onMove);
      stage.on('touchmove', onMove);
      stage.on('mouseup', cleanup);
      stage.on('touchend', cleanup);
    },
    [draggable, isContainerLayer, isSelected]
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
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
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
      {isContainerLayer ? (
        <Rect
          dash={isGroupLayer ? [6, 4] : undefined}
          fill="transparent"
          height={transform.height}
          listening={true}
          stroke={isGroupLayer ? '#6366f1' : 'transparent'}
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
          selectedLayerIdSet={selectedLayerIdSet}
          selectedPrimary={selectedPrimary}
        />
      ))}
    </Group>
  );
});
