import { nodeTransform, defaultTransform } from '@openenvx/studio/schema';
import type Konva from 'konva';
import { useCallback } from 'react';
import type { RefObject } from 'react';

import type { DragSession } from '../canvas-stage-types';
import type { FlattenedStageLayer } from '../flatten-layer-surface';
import {
  absoluteSnapToNodePosition,
  nodePositionToAbsolute,
} from '../snap/absolute-snap-to-node-position';
import {
  collectAncestorLayerIds,
  collectDescendantLayerIds,
} from '../snap/drag-snap-excludes';
import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';
import type {
  CanvasGridSnapConfig,
  CanvasLayerTransformRef,
  CanvasRect,
  CanvasStageInteractionService,
  CanvasUserGuidesSnapConfig,
} from '../stage/canvas-stage-interaction';
import { unionCanvasRects } from '../stage/canvas-stage-interaction';

export function useCanvasDragSnap({
  artboardHeight,
  artboardWidth,
  dragSessionRef,
  getGridConfig,
  getMarginInset,
  getOtherLayers,
  getUserGuidesConfig,
  layersRef,
  nodeRefs,
  selectedNodeIdsRef,
  setInteractionOverlays,
  stageInteractionRef,
  zoom,
}: {
  artboardHeight: number;
  artboardWidth: number;
  dragSessionRef: RefObject<DragSession | null>;
  getGridConfig: () => CanvasGridSnapConfig | null;
  getMarginInset: () => CanvasRect | null;
  getOtherLayers: (excludeIds: Set<string>) => CanvasLayerTransformRef[];
  getUserGuidesConfig: () => CanvasUserGuidesSnapConfig | null;
  layersRef: RefObject<FlattenedStageLayer[]>;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  selectedNodeIdsRef: RefObject<string[]>;
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
      transform: import('@openenvx/studio/schema').Transform
    ) => {
      const interaction = stageInteractionRef.current;
      const session = dragSessionRef.current;
      const artboard = { height: artboardHeight, width: artboardWidth };
      const marginInset = getMarginInset();
      const knownIds = new Set(
        layersRef.current.map((entry) => entry.layer.id)
      );
      // Nested (in group/widget): Canva-style - no document guides/snap.
      if (collectAncestorLayerIds(node, knownIds).length > 0) {
        setInteractionOverlays();
        return;
      }

      const excludeIds = new Set(
        session && selectedNodeIdsRef.current.includes(layerId)
          ? selectedNodeIdsRef.current
          : [layerId]
      );
      for (const id of collectDescendantLayerIds(layersRef.current, layerId)) {
        excludeIds.add(id);
      }
      const others = getOtherLayers(excludeIds);
      const draggedLayer = layersRef.current.find(
        (entry) => entry.layer.id === layerId
      )?.layer;
      const movingLayerType = draggedLayer?.type ?? 'unknown';

      if (
        session &&
        session.layerId === layerId &&
        selectedNodeIdsRef.current.length > 1
      ) {
        const start = session.starts.get(layerId);
        if (!start) {
          return;
        }
        const dx = node.x() - start.x;
        const dy = node.y() - start.y;
        const proposedRects = selectedNodeIdsRef.current
          .map((id) => {
            const layerStart = session.starts.get(id);
            const entry = layersRef.current.find(
              (item) => item.layer.id === id
            );
            const relativeTransform = entry
              ? nodeTransform(entry.layer)
              : defaultTransform();
            const absoluteTransform =
              entry?.absoluteTransform ?? relativeTransform;
            if (!layerStart) {
              return null;
            }
            return {
              height: relativeTransform.height,
              width: relativeTransform.width,
              x:
                absoluteTransform.x + (layerStart.x + dx - relativeTransform.x),
              y:
                absoluteTransform.y + (layerStart.y + dy - relativeTransform.y),
            };
          })
          .filter((rect): rect is CanvasRect => rect !== null);
        const moving = unionCanvasRects(proposedRects);
        const adjusted = interaction?.adjustDrag?.({
          artboard,
          grid: getGridConfig(),
          marginInset,
          moving: {
            bounds: moving,
            layerType: movingLayerType,
          },
          others,
          userGuides: getUserGuidesConfig(),
          zoom,
        });
        const snapDx = (adjusted?.x ?? moving.x) - moving.x;
        const snapDy = (adjusted?.y ?? moving.y) - moving.y;
        for (const id of selectedNodeIdsRef.current) {
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

      const entry = layersRef.current.find((item) => item.layer.id === layerId);
      const relativeTransform = entry ? nodeTransform(entry.layer) : transform;
      const absoluteTransform = entry?.absoluteTransform ?? relativeTransform;

      const adjusted = interaction?.adjustDrag?.({
        artboard,
        grid: getGridConfig(),
        marginInset,
        moving: {
          bounds: {
            height: relativeTransform.height,
            width: relativeTransform.width,
            ...nodePositionToAbsolute(
              node.x(),
              node.y(),
              relativeTransform,
              absoluteTransform
            ),
          },
          layerType: movingLayerType,
        },
        others,
        userGuides: getUserGuidesConfig(),
        zoom,
      });
      if (adjusted) {
        node.position(
          absoluteSnapToNodePosition(
            adjusted.x,
            adjusted.y,
            relativeTransform,
            absoluteTransform
          )
        );
        setInteractionOverlays(adjusted.overlays);
      }
    },
    [
      artboardHeight,
      artboardWidth,
      dragSessionRef,
      getGridConfig,
      getMarginInset,
      getOtherLayers,
      getUserGuidesConfig,
      layersRef,
      nodeRefs,
      selectedNodeIdsRef,
      setInteractionOverlays,
      stageInteractionRef,
      zoom,
    ]
  );
}
