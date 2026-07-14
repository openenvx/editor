import type { Layer as SceneLayer } from '@openenvx/core';
import { canSelectLayer, canTransformLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { createDefaultTransform } from '@openenvx/schema';
import type Konva from 'konva';
import type { RefObject } from 'react';

import type {
  CanvasSelectLayerOptions,
  CanvasStageProps,
  DragSession,
} from '../canvas-stage-types';
import type { FlattenedStageLayer } from '../flatten-layer-surface';
import {
  getActiveDragAnchor,
  getActiveHandleAnchor,
  getDragSession,
  getInteractionPreviewLayerId,
  getTransformSessionLayerId,
  reduceInteractionMode,
  type CanvasInteractionEvent,
  type CanvasInteractionMode,
} from '../interactions/canvas-interaction-mode';

export interface CanvasStageRuntimeLayerBindings {
  applyDragSnap: (
    layerId: string,
    node: Konva.Group,
    transform: NonNullable<SceneLayer['transform']>
  ) => void;
  clearOverlays: () => void;
  completeLayerTransform: (input: {
    layerId: string;
    view: LayerPreviewDescriptor;
    transform: NonNullable<SceneLayer['transform']>;
    node: Konva.Group;
    interactionKind: string | undefined;
  }) => void;
  getLayerTransform: (
    layerId: string,
    transform: NonNullable<SceneLayer['transform']>
  ) => NonNullable<SceneLayer['transform']>;
  handleLayerTransform: (
    layerId: string,
    node: Konva.Group,
    view: LayerPreviewDescriptor,
    interactionKind: string | undefined
  ) => void;
  syncLabelFromTransformer: () => void;
}

export class CanvasStageRuntime {
  readonly nodeRefs: RefObject<Map<string, Konva.Group>> = {
    current: new Map(),
  };

  readonly dragSessionRef: RefObject<DragSession | null> = { current: null };

  readonly layersRef: RefObject<FlattenedStageLayer[]> = { current: [] };

  readonly onSelectRef: RefObject<
    CanvasStageProps['onSelectLayer'] | undefined
  > = { current: undefined };

  readonly onDoubleClickRef: RefObject<CanvasStageProps['onLayerDoubleClick']> =
    {
      current: undefined,
    };

  readonly onTransformRef: RefObject<CanvasStageProps['onTransformChange']> = {
    current: undefined,
  };

  private mode: CanvasInteractionMode = { type: 'idle' };

  private listeners = new Set<() => void>();

  private layerBindings: CanvasStageRuntimeLayerBindings | null = null;

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): CanvasInteractionMode {
    return this.mode;
  }

  bindLayerHandlers(bindings: CanvasStageRuntimeLayerBindings): void {
    this.layerBindings = bindings;
  }

  dispatch(event: CanvasInteractionEvent): void {
    const nextMode = reduceInteractionMode(this.mode, event);
    if (nextMode === this.mode) {
      return;
    }
    this.mode = nextMode;
    this.dragSessionRef.current = getDragSession(nextMode);
    for (const listener of this.listeners) {
      listener();
    }
  }

  getTransformSessionLayerId(): string | null {
    return getTransformSessionLayerId(this.mode);
  }

  getActiveDragAnchor(): string | null {
    return getActiveDragAnchor(this.mode);
  }

  getActiveHandleAnchor(): string | null {
    return getActiveHandleAnchor(this.mode);
  }

  getInteractionPreviewLayerId(): string | null {
    return getInteractionPreviewLayerId(this.mode);
  }

  enterInteractionPreview(layerId: string): void {
    this.dispatch({ layerId, type: 'layerPreviewStart' });
  }

  exitInteractionPreview(): void {
    this.dispatch({ type: 'layerPreviewEnd' });
  }

  registerNode(layerId: string, node: Konva.Group | null): void {
    if (!node) {
      this.nodeRefs.current?.delete(layerId);
      return;
    }
    this.nodeRefs.current?.set(layerId, node);
  }

  isLayerSelectable(layer: SceneLayer): boolean {
    return canSelectLayer(layer);
  }

  isLayerWritable(layer: SceneLayer): boolean {
    return canTransformLayer(layer);
  }

  selectLayer(layerId: string, options?: CanvasSelectLayerOptions): void {
    this.onSelectRef.current?.(layerId, options);
  }

  openLayerEditor(layerId: string): void {
    this.onDoubleClickRef.current?.(layerId);
  }

  getLayerTransform(
    layerId: string,
    transform: NonNullable<SceneLayer['transform']>
  ): NonNullable<SceneLayer['transform']> {
    return (
      this.layerBindings?.getLayerTransform(layerId, transform) ?? transform
    );
  }

  onLayerDragStart(
    layerId: string,
    selectedLayerIds: string[],
    selectedLayerIdSet: Set<string>
  ): void {
    this.selectLayer(layerId, { setPrimary: true });

    if (!selectedLayerIdSet.has(layerId) || selectedLayerIds.length <= 1) {
      this.dragSessionRef.current = null;
      return;
    }

    const starts = new Map<string, { x: number; y: number }>();
    for (const id of selectedLayerIds) {
      const node = this.nodeRefs.current?.get(id);
      if (!node) {
        continue;
      }
      starts.set(id, { x: node.x(), y: node.y() });
    }

    const session = { layerId, starts };
    this.dragSessionRef.current = session;
    this.dispatch({ session, type: 'layerDragStart' });
  }

  onLayerDragMove(
    layerId: string,
    node: Konva.Group,
    transform: NonNullable<SceneLayer['transform']>,
    selectedLayerIds: string[]
  ): void {
    this.layerBindings?.applyDragSnap(layerId, node, transform);
    if (selectedLayerIds.includes(layerId)) {
      this.layerBindings?.syncLabelFromTransformer();
    }
  }

  onLayerDragEnd(
    layerId: string,
    selectedLayerIds: string[],
    selectedLayerIdSet: Set<string>
  ): void {
    const session = this.dragSessionRef.current;
    const isGroupDragTarget =
      selectedLayerIdSet.has(layerId) && selectedLayerIds.length > 1;
    const movedIds =
      session && session.layerId === layerId && isGroupDragTarget
        ? selectedLayerIds
        : [layerId];

    for (const movedId of movedIds) {
      const node = this.nodeRefs.current?.get(movedId);
      const movedLayer = this.layersRef.current?.find(
        (item) => item.layer.id === movedId
      )?.layer;
      if (!node || !movedLayer) {
        continue;
      }
      const movedTransform = movedLayer.transform ?? createDefaultTransform();
      this.onTransformRef.current?.(movedId, {
        transform: {
          ...movedTransform,
          x: node.x(),
          y: node.y(),
        },
      });
    }

    this.dragSessionRef.current = null;
    this.layerBindings?.clearOverlays();
    if (selectedLayerIds.includes(layerId)) {
      this.layerBindings?.syncLabelFromTransformer();
    }
    this.dispatch({ type: 'layerDragEnd' });
  }

  onLayerTransform(
    layerId: string,
    node: Konva.Group,
    view: LayerPreviewDescriptor,
    interactionKind: string | undefined,
    writable: boolean
  ): void {
    if (!writable) {
      return;
    }
    this.layerBindings?.handleLayerTransform(
      layerId,
      node,
      view,
      interactionKind
    );
  }

  onLayerTransformEnd(input: {
    layerId: string;
    view: LayerPreviewDescriptor;
    transform: NonNullable<SceneLayer['transform']>;
    node: Konva.Group;
    interactionKind: string | undefined;
    writable: boolean;
  }): void {
    if (!input.writable) {
      return;
    }
    this.layerBindings?.completeLayerTransform(input);
  }

  onTransformStart(layerId: string, anchor: string | null): void {
    this.dispatch({ anchor, layerId, type: 'transformStart' });
  }

  onTransformEnd(): void {
    this.dispatch({ type: 'transformEnd' });
  }

  onHandleDragStart(layerId: string, anchor: string): void {
    this.dispatch({ anchor, layerId, type: 'handleDragStart' });
  }

  onHandleDragEnd(): void {
    this.dispatch({ type: 'handleDragEnd' });
  }

  forceIdle(): void {
    this.dragSessionRef.current = null;
    this.dispatch({ type: 'forceIdle' });
  }
}

export function createCanvasStageRuntime(): CanvasStageRuntime {
  return new CanvasStageRuntime();
}
