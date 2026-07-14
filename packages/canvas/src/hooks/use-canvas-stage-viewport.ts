import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { computeArtboardOffset } from '../artboard-offset';
import { ViewportController } from '../viewport';

export interface UseCanvasStageViewportInput {
  containerWidth: number;
  containerHeight: number;
  artboardWidth: number;
  artboardHeight: number;
  onViewportChange?: (zoom: number) => void;
  viewportController?: ViewportController;
}

export function useCanvasStageViewport({
  containerWidth,
  containerHeight,
  artboardWidth,
  artboardHeight,
  onViewportChange,
  viewportController: externalViewport,
}: UseCanvasStageViewportInput) {
  const [internalViewport] = useState(() => new ViewportController());
  const viewport = externalViewport ?? internalViewport;
  const [, setViewportTick] = useState(0);
  const onViewportRef = useRef(onViewportChange);
  onViewportRef.current = onViewportChange;

  const vp = viewport.getViewport();
  const artboardOffset = useMemo(
    () =>
      computeArtboardOffset(
        containerWidth,
        containerHeight,
        artboardWidth,
        artboardHeight,
        vp.zoom,
        vp.panX,
        vp.panY
      ),
    [
      artboardHeight,
      artboardWidth,
      containerHeight,
      containerWidth,
      vp.panX,
      vp.panY,
      vp.zoom,
    ]
  );

  const bumpViewport = useCallback(() => {
    const next = viewport.getViewport();
    onViewportRef.current?.(next.zoom);
    setViewportTick((value) => value + 1);
  }, [viewport]);

  useEffect(() => {
    onViewportRef.current?.(viewport.getViewport().zoom);
  }, [viewport]);

  return {
    artboardOffset,
    bumpViewport,
    viewport,
    vp,
  };
}
