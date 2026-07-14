export interface DragSessionPayload {
  layerId: string;
  starts: Map<string, { x: number; y: number }>;
}

export type CanvasInteractionMode =
  | { type: 'idle' }
  | { type: 'dragging'; session: DragSessionPayload }
  | { type: 'transforming'; layerId: string; anchor: string | null }
  | { type: 'handleDrag'; layerId: string; anchor: string };

export type CanvasInteractionEvent =
  | { type: 'layerDragStart'; session: DragSessionPayload }
  | { type: 'layerDragEnd' }
  | { type: 'transformStart'; layerId: string; anchor: string | null }
  | { type: 'transformEnd' }
  | { type: 'handleDragStart'; layerId: string; anchor: string }
  | { type: 'handleDragEnd' }
  | { type: 'forceIdle' };

export function getTransformSessionLayerId(
  mode: CanvasInteractionMode
): string | null {
  if (mode.type === 'transforming' || mode.type === 'handleDrag') {
    return mode.layerId;
  }
  return null;
}

export function getActiveDragAnchor(
  mode: CanvasInteractionMode
): string | null {
  if (mode.type === 'transforming') {
    return mode.anchor;
  }
  return null;
}

export function getActiveHandleAnchor(
  mode: CanvasInteractionMode
): string | null {
  if (mode.type === 'handleDrag') {
    return mode.anchor;
  }
  return null;
}

export function getDragSession(
  mode: CanvasInteractionMode
): DragSessionPayload | null {
  if (mode.type === 'dragging') {
    return mode.session;
  }
  return null;
}

export function canStartLayerDrag(mode: CanvasInteractionMode): boolean {
  return mode.type === 'idle';
}

export function canStartTransform(mode: CanvasInteractionMode): boolean {
  return mode.type === 'idle';
}

export function canStartHandleDrag(mode: CanvasInteractionMode): boolean {
  return mode.type === 'idle';
}

export function reduceInteractionMode(
  mode: CanvasInteractionMode,
  event: CanvasInteractionEvent
): CanvasInteractionMode {
  switch (event.type) {
    case 'layerDragStart': {
      if (!canStartLayerDrag(mode)) {
        return mode;
      }
      return { session: event.session, type: 'dragging' };
    }

    case 'layerDragEnd': {
      if (mode.type !== 'dragging') {
        return mode;
      }
      return { type: 'idle' };
    }

    case 'transformStart': {
      if (!canStartTransform(mode)) {
        return mode;
      }
      return {
        anchor: event.anchor,
        layerId: event.layerId,
        type: 'transforming',
      };
    }

    case 'transformEnd': {
      if (mode.type !== 'transforming') {
        return mode;
      }
      return { type: 'idle' };
    }

    case 'handleDragStart': {
      if (!canStartHandleDrag(mode)) {
        return mode;
      }
      return {
        anchor: event.anchor,
        layerId: event.layerId,
        type: 'handleDrag',
      };
    }

    case 'handleDragEnd': {
      if (mode.type !== 'handleDrag') {
        return mode;
      }
      return { type: 'idle' };
    }

    case 'forceIdle': {
      return { type: 'idle' };
    }

    default: {
      return mode;
    }
  }
}
