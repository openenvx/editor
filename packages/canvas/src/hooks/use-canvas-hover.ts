import type Konva from 'konva';
import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export interface UseCanvasHoverInput {
  artboardGroupRef: RefObject<Konva.Group | null>;
  hoveredLayerId?: string | null;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  onHoverLayer?: (layerId: string | null) => void;
}

export function useCanvasHover({
  artboardGroupRef,
  hoveredLayerId = null,
  nodeRefs,
  onHoverLayer,
}: UseCanvasHoverInput) {
  const onHoverRef = useRef(onHoverLayer);
  onHoverRef.current = onHoverLayer;
  const lastReportedHoverRef = useRef<string | null>(null);

  const resolveHoveredLayerId = useCallback(
    (stage: Konva.Stage | null) => {
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
    },
    [nodeRefs]
  );

  const handlePointerHover = useCallback(() => {
    const stage = artboardGroupRef.current?.getStage() ?? null;
    const nextId = resolveHoveredLayerId(stage);
    if (nextId === lastReportedHoverRef.current) {
      return;
    }
    lastReportedHoverRef.current = nextId;
    onHoverRef.current?.(nextId);
  }, [artboardGroupRef, resolveHoveredLayerId]);

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

  return {
    handlePointerHover,
    handlePointerLeave,
  };
}
