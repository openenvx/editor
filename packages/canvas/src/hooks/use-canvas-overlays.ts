import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

import { EMPTY_OVERLAY_PRIMITIVES } from '../canvas-stage-types';
import type { CanvasOverlayPrimitive } from '../stage/canvas-overlay-primitives';
import type {
  CanvasRect,
  CanvasStageInteractionService,
} from '../stage/canvas-stage-interaction';

function createMarginOverlay(marginInset: CanvasRect): CanvasOverlayPrimitive {
  return {
    dashed: true,
    height: marginInset.height,
    kind: 'rect',
    strokeWidth: 1.5,
    width: marginInset.width,
    x: marginInset.x,
    y: marginInset.y,
  };
}

function createGridOverlay(input: {
  artboardHeight: number;
  artboardWidth: number;
  gridSize: number;
}): CanvasOverlayPrimitive {
  return {
    height: input.artboardHeight,
    kind: 'grid',
    size: input.gridSize,
    width: input.artboardWidth,
  };
}

export function composeCanvasOverlays(input: {
  artboardHeight: number;
  artboardWidth: number;
  gridSize: number;
  interactionOverlays?: readonly CanvasOverlayPrimitive[];
  marginInset: CanvasRect | null;
  showGrid: boolean;
  showMargins: boolean;
  staticOverlays?: readonly CanvasOverlayPrimitive[];
}): CanvasOverlayPrimitive[] {
  const primitives: CanvasOverlayPrimitive[] = [
    ...(input.staticOverlays ?? []),
    ...(input.interactionOverlays ?? []),
  ];
  if (input.showGrid && input.gridSize > 0) {
    primitives.unshift(
      createGridOverlay({
        artboardHeight: input.artboardHeight,
        artboardWidth: input.artboardWidth,
        gridSize: input.gridSize,
      })
    );
  }
  if (input.showMargins && input.marginInset) {
    primitives.push(createMarginOverlay(input.marginInset));
  }
  return primitives.length > 0 ? primitives : EMPTY_OVERLAY_PRIMITIVES;
}

export function useCanvasOverlays({
  artboardHeight,
  artboardWidth,
  getMarginInset,
  gridSize,
  showGrid,
  showMargins,
  stageInteractionRef,
  zoom,
}: {
  artboardHeight: number;
  artboardWidth: number;
  getMarginInset: () => CanvasRect | null;
  gridSize: number;
  showGrid: boolean;
  showMargins: boolean;
  stageInteractionRef: RefObject<CanvasStageInteractionService | null>;
  zoom: number;
}) {
  const [overlayPrimitives, setOverlayPrimitives] = useState<
    CanvasOverlayPrimitive[]
  >(EMPTY_OVERLAY_PRIMITIVES);

  const getStaticOverlays =
    useCallback((): readonly CanvasOverlayPrimitive[] => {
      const interaction = stageInteractionRef.current;
      return (
        interaction?.buildOverlays?.({
          artboard: { height: artboardHeight, width: artboardWidth },
          zoom,
        }) ?? []
      );
    }, [artboardHeight, artboardWidth, stageInteractionRef, zoom]);

  const setInteractionOverlays = useCallback(
    (interactionOverlays?: readonly CanvasOverlayPrimitive[]) => {
      setOverlayPrimitives(
        composeCanvasOverlays({
          artboardHeight,
          artboardWidth,
          gridSize,
          interactionOverlays,
          marginInset: getMarginInset(),
          showGrid,
          showMargins,
          staticOverlays: getStaticOverlays(),
        })
      );
    },
    [
      artboardHeight,
      artboardWidth,
      getMarginInset,
      getStaticOverlays,
      gridSize,
      showGrid,
      showMargins,
    ]
  );

  const clearOverlays = useCallback(() => {
    setInteractionOverlays(undefined);
  }, [setInteractionOverlays]);

  const refreshStaticOverlays = useCallback(() => {
    setInteractionOverlays(undefined);
  }, [setInteractionOverlays]);

  useEffect(() => {
    refreshStaticOverlays();
  }, [refreshStaticOverlays]);

  return {
    clearOverlays,
    overlayPrimitives,
    setInteractionOverlays,
  };
}
