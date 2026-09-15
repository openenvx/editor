import type Konva from 'konva';
import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { reattachTransformerFromSelection } from '../canvas-transformer-utils';

export interface UseDragEndListenersInput {
  clearHandleDragState: (options?: { clearLiveOverrides?: boolean }) => void;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  onEndDrag: () => void;
  selectedLayerIdsRef: RefObject<string[]>;
  syncLabelFromTransformer: () => void;
  transformerRef: RefObject<Konva.Transformer | null>;
}

export function useDragEndListeners({
  clearHandleDragState,
  nodeRefs,
  onEndDrag,
  selectedLayerIdsRef,
  syncLabelFromTransformer,
  transformerRef,
}: UseDragEndListenersInput) {
  const endDragListenersRef = useRef<(() => void) | null>(null);

  const detachEndDragListeners = useCallback(() => {
    endDragListenersRef.current?.();
    endDragListenersRef.current = null;
  }, []);

  const attachEndDragListeners = useCallback(() => {
    detachEndDragListeners();

    const endDrag = () => {
      onEndDrag();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearHandleDragState();
        reattachTransformerFromSelection(
          nodeRefs,
          selectedLayerIdsRef,
          transformerRef,
          syncLabelFromTransformer
        );
      }
    };

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('touchend', endDrag);
    window.addEventListener('keydown', onKeyDown);
    endDragListenersRef.current = () => {
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('touchend', endDrag);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    clearHandleDragState,
    detachEndDragListeners,
    nodeRefs,
    onEndDrag,
    selectedLayerIdsRef,
    syncLabelFromTransformer,
    transformerRef,
  ]);

  useEffect(
    () => () => {
      detachEndDragListeners();
    },
    [detachEndDragListeners]
  );

  return {
    attachEndDragListeners,
    detachEndDragListeners,
  };
}
