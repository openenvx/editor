import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import type { Transform } from '@xmazu/openenvxee-schema';
import type Konva from 'konva';
import type { RefObject } from 'react';

import type { SelectionBounds } from '../canvas-stage-types';
import { createTransformDragContext, pointerToParentLocal } from '../geometry';
import type { TransformDragContext } from '../geometry';
import type {
  CanvasLayerInteractionRegistration,
  CanvasTransformBox,
  CanvasTransformModifiers,
  CanvasTransformResult,
} from '../registry/canvas-registry-types';
import { isRichTextResizeAnchor } from '../rich-text-resize';
import {
  applyGenericBoundBoxFunc,
  createGenericTransformContext,
  createGenericTransformSession,
  type GenericTransformSession,
} from './generic-transform-driver';
import {
  bakeRichTextTransformEnd,
  boundRichTextBox,
  createRichTextTransformRuntime,
  endRichTextTransformSession,
  runRichTextLiveBake,
  startRichTextTransform,
  type RichTextCornerSession,
} from './rich-text-transform-driver';

export interface TransformSessionRefs {
  transformDragRef: RefObject<TransformDragContext | null>;
  richTextCornerSessionRef: RefObject<RichTextCornerSession | null>;
  genericTransformSessionRef: RefObject<GenericTransformSession | null>;
  bakeInProgressRef: RefObject<boolean>;
  cornerBakeRafRef: RefObject<number | null>;
}

interface TransformStartInput {
  layerId: string;
  layer: SceneLayer;
  view: LayerPreviewDescriptor;
  interaction: CanvasLayerInteractionRegistration;
  node: Konva.Group;
  transformer: Konva.Transformer | null;
  activeAnchor: string | null;
  refs: TransformSessionRefs;
  nodeRefs: Map<string, Konva.Group>;
  getTransformModifiers: () => CanvasTransformModifiers;
  setLiveTransformOverride: (
    layerId: string,
    transform: Transform | null
  ) => void;
  updateSizeLabelImperatively: (bounds: SelectionBounds) => void;
}

interface TransformBoundBoxInput {
  oldBox: CanvasTransformBox;
  newBox: CanvasTransformBox;
  refs: TransformSessionRefs;
  transformerRef: RefObject<Konva.Transformer | null>;
  getTransformModifiers: () => CanvasTransformModifiers;
  setLiveTransformOverride: (
    layerId: string,
    transform: Transform | null
  ) => void;
}

interface TransformLiveInput {
  layerId: string;
  view: LayerPreviewDescriptor;
  node: Konva.Group;
  refs: TransformSessionRefs;
  transformerRef: RefObject<Konva.Transformer | null>;
  nodeRefs: Map<string, Konva.Group>;
  flattenedLayers: { layer: SceneLayer; view: LayerPreviewDescriptor }[];
  getTransformModifiers: () => CanvasTransformModifiers;
  setLiveTransformOverride: (
    layerId: string,
    transform: Transform | null
  ) => void;
  updateSizeLabelImperatively: (bounds: SelectionBounds) => void;
}

interface TransformCompleteInput {
  layerId: string;
  view: LayerPreviewDescriptor;
  transform: NonNullable<SceneLayer['transform']>;
  node: Konva.Group;
  refs: TransformSessionRefs;
  transformerRef: RefObject<Konva.Transformer | null>;
  nodeRefs: Map<string, Konva.Group>;
  getTransformModifiers: () => CanvasTransformModifiers;
  setLiveTransformOverride: (
    layerId: string,
    transform: Transform | null
  ) => void;
  updateSizeLabelImperatively: (bounds: SelectionBounds) => void;
}

export interface LayerTransformStrategy {
  start(input: TransformStartInput): void;
  boundBox(input: TransformBoundBoxInput): CanvasTransformBox | null;
  live(input: TransformLiveInput): void;
  complete(input: TransformCompleteInput): CanvasTransformResult | null;
  endSession(refs: TransformSessionRefs): void;
}

function createRichTextRuntimeRefs(
  refs: TransformSessionRefs,
  nodeRefs: Map<string, Konva.Group>,
  updateSizeLabelImperatively: (bounds: SelectionBounds) => void
) {
  return {
    bakeInProgressRef: refs.bakeInProgressRef,
    cornerBakeRafRef: refs.cornerBakeRafRef,
    dragRef: refs.transformDragRef,
    nodeRefs,
    onUpdateSizeLabel: updateSizeLabelImperatively,
    sessionRef: refs.richTextCornerSessionRef,
  };
}

export const richTextTransformStrategy: LayerTransformStrategy = {
  start(input) {
    const {
      activeAnchor,
      layerId,
      layer,
      node,
      refs,
      transformer,
      updateSizeLabelImperatively,
      view,
      nodeRefs,
    } = input;
    startRichTextTransform(
      createRichTextTransformRuntime(
        layerId,
        view as Extract<LayerPreviewDescriptor, { kind: 'richText' }>,
        layer.transform,
        node,
        transformer,
        activeAnchor,
        createRichTextRuntimeRefs(refs, nodeRefs, updateSizeLabelImperatively)
      )
    );
  },

  boundBox(input) {
    const session = input.refs.richTextCornerSessionRef.current;
    const anchor = input.refs.transformDragRef.current?.anchor ?? '';
    if (!session || !isRichTextResizeAnchor(anchor)) {
      return null;
    }
    const transformer = input.transformerRef.current;
    const stage = transformer?.getStage();
    const node = transformer?.nodes()[0] as Konva.Group | undefined;
    const parent = node?.getParent();
    let pointer: { x: number; y: number } | null = null;
    if (stage && parent) {
      const stagePointer = stage.getPointerPosition();
      if (stagePointer) {
        pointer = parent
          .getAbsoluteTransform()
          .copy()
          .invert()
          .point(stagePointer);
      }
    }
    return boundRichTextBox(
      session,
      anchor,
      input.oldBox,
      input.newBox,
      pointer
    );
  },

  live(input) {
    const node = input.nodeRefs.get(input.layerId);
    if (!node) {
      return;
    }
    if (!input.refs.transformDragRef.current && input.transformerRef.current) {
      input.refs.transformDragRef.current = createTransformDragContext(
        input.transformerRef.current
      );
    }
    runRichTextLiveBake(
      createRichTextTransformRuntime(
        input.layerId,
        input.view as Extract<LayerPreviewDescriptor, { kind: 'richText' }>,
        input.flattenedLayers.find(({ layer }) => layer.id === input.layerId)
          ?.layer.transform,
        node,
        input.transformerRef.current,
        input.refs.transformDragRef.current?.anchor ?? null,
        createRichTextRuntimeRefs(
          input.refs,
          input.nodeRefs,
          input.updateSizeLabelImperatively
        )
      )
    );
  },

  complete(input) {
    const baked = bakeRichTextTransformEnd(
      createRichTextTransformRuntime(
        input.layerId,
        input.view as Extract<LayerPreviewDescriptor, { kind: 'richText' }>,
        input.transform,
        input.node,
        input.transformerRef.current,
        input.refs.transformDragRef.current?.anchor ?? null,
        createRichTextRuntimeRefs(
          input.refs,
          input.nodeRefs,
          input.updateSizeLabelImperatively
        )
      ),
      input.node
    );
    if (!baked) {
      return null;
    }
    return { fontSize: baked.fontSize, transform: baked.transform };
  },

  endSession(refs) {
    endRichTextTransformSession({
      cornerBakeRafRef: refs.cornerBakeRafRef,
      sessionRef: refs.richTextCornerSessionRef,
    });
  },
};

export const genericTransformStrategy: LayerTransformStrategy = {
  start(input) {
    const {
      activeAnchor,
      getTransformModifiers,
      interaction,
      layerId,
      layer,
      node,
      refs,
      setLiveTransformOverride,
      transformer,
      view,
    } = input;
    const currentTransform = layer.transform ?? createDefaultTransform();
    refs.genericTransformSessionRef.current = createGenericTransformSession({
      interaction,
      layerId,
      transform: currentTransform,
      view,
    });
    refs.transformDragRef.current = transformer
      ? createTransformDragContext(transformer)
      : null;
    interaction.onTransformStart?.(
      createGenericTransformContext({
        anchor: activeAnchor,
        modifiers: getTransformModifiers(),
        node,
        session: refs.genericTransformSessionRef.current,
        setLiveTransform: (nextTransform) => {
          setLiveTransformOverride(layerId, nextTransform);
        },
        transformer,
      })
    );
  },

  boundBox(input) {
    const genericSession = input.refs.genericTransformSessionRef.current;
    if (!genericSession?.interaction.boundBoxFunc) {
      return null;
    }
    const anchor = input.refs.transformDragRef.current?.anchor ?? '';
    const transformer = input.transformerRef.current;
    const node = transformer?.nodes()[0] as Konva.Group | undefined;
    const parent = node?.getParent();
    const stage = transformer?.getStage();
    const pointerParentLocal =
      stage && parent ? pointerToParentLocal(stage, parent) : null;
    return applyGenericBoundBoxFunc({
      anchor,
      modifiers: input.getTransformModifiers(),
      newBox: input.newBox,
      node: node ?? null,
      oldBox: input.oldBox,
      pointerParentLocal,
      session: genericSession,
      setLiveTransform: (nextTransform) => {
        input.setLiveTransformOverride(genericSession.layerId, nextTransform);
      },
      transformer: transformer ?? null,
    });
  },

  live(input) {
    const genericSession = input.refs.genericTransformSessionRef.current;
    if (
      !genericSession ||
      genericSession.layerId !== input.layerId ||
      !genericSession.interaction.onTransform
    ) {
      return;
    }
    genericSession.interaction.onTransform(
      createGenericTransformContext({
        anchor: input.refs.transformDragRef.current?.anchor ?? null,
        modifiers: input.getTransformModifiers(),
        node: input.node,
        session: genericSession,
        setLiveTransform: (nextTransform) => {
          input.setLiveTransformOverride(input.layerId, nextTransform);
        },
        transformer: input.transformerRef.current,
      })
    );
  },

  complete(input) {
    const genericSession = input.refs.genericTransformSessionRef.current;
    if (
      !genericSession ||
      genericSession.layerId !== input.layerId ||
      !genericSession.interaction.onTransformEnd
    ) {
      return null;
    }
    const result = genericSession.interaction.onTransformEnd(
      createGenericTransformContext({
        anchor: input.refs.transformDragRef.current?.anchor ?? null,
        modifiers: input.getTransformModifiers(),
        node: input.node,
        session: genericSession,
        setLiveTransform: (liveTransform) => {
          input.setLiveTransformOverride(input.layerId, liveTransform);
        },
        transformer: input.transformerRef.current,
      })
    );
    if (!result) {
      return null;
    }
    return {
      dataPatch: result.dataPatch,
      transform: result.transform,
    };
  },

  endSession(refs) {
    refs.genericTransformSessionRef.current = null;
  },
};

export const defaultTransformStrategy: LayerTransformStrategy = {
  start(input) {
    input.refs.transformDragRef.current = input.transformer
      ? createTransformDragContext(input.transformer)
      : null;
  },
  boundBox() {
    return null;
  },
  live() {},
  complete() {
    return null;
  },
  endSession(refs) {
    refs.transformDragRef.current = null;
  },
};

export function selectTransformStrategy(
  interactionKind: string | undefined
): LayerTransformStrategy {
  if (interactionKind === 'richText') {
    return richTextTransformStrategy;
  }
  if (interactionKind) {
    return genericTransformStrategy;
  }
  return defaultTransformStrategy;
}
