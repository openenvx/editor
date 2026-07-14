import {
  canSelectLayer,
  canTransformLayer,
  type ExternalStore,
  type Layer as SceneLayer,
} from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { createDefaultTransform } from '@openenvx/schema';
import type { Transform } from '@openenvx/schema';
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
import { selectLayerTransform } from './canvas-stage-selectors';
import {
  createCanvasStageSnapshot,
  type CanvasStageSnapshot,
} from './canvas-stage-snapshot';

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
  handleLayerTransform: (
    layerId: string,
    node: Konva.Group,
    view: LayerPreviewDescriptor,
    interactionKind: string | undefined
  ) => void;
  syncLabelFromTransformer: () => void;
}

export class CanvasStageRuntime implements ExternalStore<CanvasStageSnapshot> {
  readonly nodeRefs: RefObject<Map<string, Konva.Group>> = {
    current: new Map(),
  };

  readonly dragSessionRef: RefObject<DragSession | null> = { current: null };

  readonly layersRef: RefObject<FlattenedStageLayer[]> = { current: [] };

  readonly selectedLayerIdsRef: RefObject<string[]> = { current: [] };

  readonly selectedLayerIdSetRef: RefObject<Set<string>> = {
    current: new Set(),
  };

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

  private liveTransforms = new Map<string, Transform>();

  private cachedSnapshot: CanvasStageSnapshot = createCanvasStageSnapshot({
    mode: this.mode,
    liveTransforms: this.liveTransforms,
  });

  private listeners = new Set<(snapshot: CanvasStageSnapshot) => void>();

  private layerBindings: CanvasStageRuntimeLayerBindings | null = null;

  private registerNodeCallbacks = new Map<
    string,
    (node: Konva.Group | null) => void
  >();

  subscribe(listener: (snapshot: CanvasStageSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.cachedSnapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): CanvasStageSnapshot {
    return this.cachedSnapshot;
  }

  bindLayerHandlers(bindings: CanvasStageRuntimeLayerBindings): void {
    this.layerBindings = bindings;
  }

  setLiveTransformOverride(layerId: string, transform: Transform | null): void {
    const next = new Map(this.liveTransforms);
    if (transform) {
      next.set(layerId, transform);
    } else {
      next.delete(layerId);
    }
    this.liveTransforms = next;
    this.invalidateSnapshot();
  }

  setLiveTransformOverrides(overrides: Map<string, Transform>): void {
    this.liveTransforms = new Map(overrides);
    this.invalidateSnapshot();
  }

  getRegisterNode(layerId: string): (node: Konva.Group | null) => void {
    let callback = this.registerNodeCallbacks.get(layerId);
    if (!callback) {
      callback = (node) => {
        this.registerNode(layerId, node);
      };
      this.registerNodeCallbacks.set(layerId, callback);
    }
    return callback;
  }

  dispatch(event: CanvasInteractionEvent): void {
    const nextMode = reduceInteractionMode(this.mode, event);
    if (nextMode === this.mode) {
      return;
    }
    this.mode = nextMode;
    this.dragSessionRef.current = getDragSession(nextMode);
    this.invalidateSnapshot();
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
      this.registerNodeCallbacks.delete(layerId);
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
    return selectLayerTransform(this.cachedSnapshot, layerId, transform);
  }

  onLayerDragStart(layerId: string): void {
    const selectedLayerIds = this.selectedLayerIdsRef.current ?? [];
    const selectedLayerIdSet = this.selectedLayerIdSetRef.current ?? new Set();

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
    transform: NonNullable<SceneLayer['transform']>
  ): void {
    const selectedLayerIds = this.selectedLayerIdsRef.current ?? [];
    this.layerBindings?.applyDragSnap(layerId, node, transform);
    if (selectedLayerIds.includes(layerId)) {
      this.layerBindings?.syncLabelFromTransformer();
    }
  }

  onLayerDragEnd(layerId: string): void {
    const selectedLayerIds = this.selectedLayerIdsRef.current ?? [];
    const selectedLayerIdSet = this.selectedLayerIdSetRef.current ?? new Set();
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

  private invalidateSnapshot(): void {
    this.cachedSnapshot = createCanvasStageSnapshot({
      liveTransforms: this.liveTransforms,
      mode: this.mode,
    });
    for (const listener of this.listeners) {
      listener(this.cachedSnapshot);
    }
  }
}

export function createCanvasStageRuntime(): CanvasStageRuntime {
  return new CanvasStageRuntime();
}
