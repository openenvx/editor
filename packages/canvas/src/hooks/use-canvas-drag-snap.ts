import type { Layer as SceneLayer } from '@openenvx/core';
import { createDefaultTransform } from '@openenvx/schema';
import type Konva from 'konva';
import { useCallback } from 'react';
import type { RefObject } from 'react';

import type { CanvasStageLayer, DragSession } from '../canvas-stage-types';
import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';
import type {
  CanvasLayerTransformRef,
  CanvasRect,
  CanvasStageInteractionService,
} from '../stage/canvas-stage-interaction';
import { unionCanvasRects } from '../stage/canvas-stage-interaction';

export function useCanvasDragSnap({
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
  zoom,
}: {
  artboardHeight: number;
  artboardWidth: number;
  dragSessionRef: RefObject<DragSession | null>;
  getMarginInset: () => CanvasRect | null;
  getOtherLayers: (excludeIds: Set<string>) => CanvasLayerTransformRef[];
  layersRef: RefObject<CanvasStageLayer[]>;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  selectedLayerIdsRef: RefObject<string[]>;
  setInteractionOverlays: (
    overlays?: readonly CanvasOverlayPrimitive[]
  ) => void;
  stageInteractionRef: RefObject<CanvasStageInteractionService | null>;
  zoom: number;
}) {
  return useCallback(
    (
      layerId: string,
      node: Konva.Group,
      transform: NonNullable<SceneLayer['transform']>
    ) => {
      const interaction = stageInteractionRef.current;
      const session = dragSessionRef.current;
      const artboard = { height: artboardHeight, width: artboardWidth };
      const marginInset = getMarginInset();
      const excludeIds = new Set(
        session && selectedLayerIdsRef.current.includes(layerId)
          ? selectedLayerIdsRef.current
          : [layerId]
      );
      const others = getOtherLayers(excludeIds);
      const draggedLayer = layersRef.current.find(
        (entry) => entry.layer.id === layerId
      )?.layer;
      const movingLayerType = draggedLayer?.type ?? 'unknown';

      if (
        session &&
        session.layerId === layerId &&
        selectedLayerIdsRef.current.length > 1
      ) {
        const start = session.starts.get(layerId);
        if (!start) {
          return;
        }
        const dx = node.x() - start.x;
        const dy = node.y() - start.y;
        const proposedRects = selectedLayerIdsRef.current
          .map((id) => {
            const layerStart = session.starts.get(id);
            const layerTransform =
              layersRef.current.find((entry) => entry.layer.id === id)?.layer
                .transform ?? createDefaultTransform();
            if (!layerStart) {
              return null;
            }
            return {
              height: layerTransform.height,
              width: layerTransform.width,
              x: layerStart.x + dx,
              y: layerStart.y + dy,
            };
          })
          .filter((rect): rect is CanvasRect => rect !== null);
        const moving = unionCanvasRects(proposedRects);
        const adjusted = interaction?.adjustDrag?.({
          artboard,
          marginInset,
          moving: {
            bounds: moving,
            layerType: movingLayerType,
          },
          others,
          zoom,
        });
        const snapDx = (adjusted?.x ?? moving.x) - moving.x;
        const snapDy = (adjusted?.y ?? moving.y) - moving.y;
        for (const id of selectedLayerIdsRef.current) {
          const layerStart = session.starts.get(id);
          const targetNode = nodeRefs.current.get(id);
          if (!layerStart || !targetNode) {
            continue;
          }
          targetNode.position({
            x: layerStart.x + dx + snapDx,
            y: layerStart.y + dy + snapDy,
          });
        }
        if (adjusted) {
          setInteractionOverlays(adjusted.overlays);
        }
        return;
      }

      const adjusted = interaction?.adjustDrag?.({
        artboard,
        marginInset,
        moving: {
          bounds: {
            height: transform.height,
            width: transform.width,
            x: node.x(),
            y: node.y(),
          },
          layerType: movingLayerType,
        },
        others,
        zoom,
      });
      if (adjusted) {
        node.position({ x: adjusted.x, y: adjusted.y });
        setInteractionOverlays(adjusted.overlays);
      }
    },
    [
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
      zoom,
    ]
  );
}
