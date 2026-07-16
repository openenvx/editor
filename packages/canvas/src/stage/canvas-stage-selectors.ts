import type { Transform } from '@openenvx/schema';

import {
  getActiveDragAnchor,
  getActiveHandleAnchor,
  getInteractionPreviewLayerId,
  getTransformSessionLayerId,
} from '../interactions/canvas-interaction-mode';
import type { CanvasLayerInteractionRegistration } from '../registry/canvas-registry-types';
import type { CanvasStageSnapshot } from './canvas-stage-snapshot';

export interface CanvasLayerRenderSlice {
  transform: Transform;
  hideContent: boolean;
  draggable: boolean;
  visible: boolean;
}

export function selectLayerTransform(
  snapshot: CanvasStageSnapshot,
  layerId: string,
  base: Transform
): Transform {
  return snapshot.liveTransforms.get(layerId) ?? base;
}

export function selectTransformSessionLayerId(
  snapshot: CanvasStageSnapshot
): string | null {
  return getTransformSessionLayerId(snapshot.mode);
}

export function selectInteractionPreviewLayerId(
  snapshot: CanvasStageSnapshot
): string | null {
  return getInteractionPreviewLayerId(snapshot.mode);
}

export function selectActiveDragAnchor(
  snapshot: CanvasStageSnapshot
): string | null {
  return getActiveDragAnchor(snapshot.mode);
}

export function selectActiveHandleAnchor(
  snapshot: CanvasStageSnapshot
): string | null {
  return getActiveHandleAnchor(snapshot.mode);
}

export function selectLayerHideContent(
  snapshot: CanvasStageSnapshot,
  layerId: string,
  interaction: CanvasLayerInteractionRegistration | undefined,
  editingLayerId: string | null
): boolean {
  const transformSessionLayerId = selectTransformSessionLayerId(snapshot);
  const interactionPreviewLayerId = selectInteractionPreviewLayerId(snapshot);
  const isImperativeTransformTarget =
    transformSessionLayerId === layerId &&
    interaction?.hideContentDuringTransform?.(layerId) === true;
  const isInteractionPreviewTarget =
    interactionPreviewLayerId === layerId &&
    interaction?.hideContentDuringTransform?.(layerId) === true;
  const isHiddenDuringEdit =
    interaction?.hideContentDuringEdit?.(editingLayerId, layerId) ?? false;
  return (
    isImperativeTransformTarget ||
    isInteractionPreviewTarget ||
    isHiddenDuringEdit
  );
}

function selectLayerDraggable(
  snapshot: CanvasStageSnapshot,
  layerId: string,
  isEditing: boolean,
  writable: boolean,
  layerVisible: boolean
): boolean {
  const transformSessionLayerId = selectTransformSessionLayerId(snapshot);
  const isImperativeTransformTarget = transformSessionLayerId === layerId;
  return layerVisible && !isEditing && writable && !isImperativeTransformTarget;
}

export function selectLayerSlice(
  snapshot: CanvasStageSnapshot,
  layerId: string,
  baseTransform: Transform,
  interaction: CanvasLayerInteractionRegistration | undefined,
  editingLayerId: string | null,
  writable: boolean,
  layerVisible: boolean
): CanvasLayerRenderSlice {
  const isEditing = editingLayerId === layerId;
  return {
    draggable: selectLayerDraggable(
      snapshot,
      layerId,
      isEditing,
      writable,
      layerVisible
    ),
    hideContent: selectLayerHideContent(
      snapshot,
      layerId,
      interaction,
      editingLayerId
    ),
    transform: selectLayerTransform(snapshot, layerId, baseTransform),
    visible: layerVisible && !isEditing,
  };
}

export function shallowSliceEqual(
  a: CanvasLayerRenderSlice,
  b: CanvasLayerRenderSlice
): boolean {
  return (
    a.transform === b.transform &&
    a.hideContent === b.hideContent &&
    a.draggable === b.draggable &&
    a.visible === b.visible
  );
}
