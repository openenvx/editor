import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import type { Transform } from '@xmazu/openenvxee-schema';
import type Konva from 'konva';

import type {
  CanvasLayerInteractionRegistration,
  CanvasTransformBox,
  CanvasTransformContext,
  CanvasTransformModifiers,
} from '../registry/canvas-registry-types';

export interface GenericTransformSession {
  interaction: CanvasLayerInteractionRegistration;
  layerId: string;
  transform: Transform;
  view: LayerPreviewDescriptor;
}

export function createGenericTransformSession(input: {
  interaction: CanvasLayerInteractionRegistration;
  layerId: string;
  transform: Transform;
  view: LayerPreviewDescriptor;
}): GenericTransformSession {
  return {
    interaction: input.interaction,
    layerId: input.layerId,
    transform: input.transform,
    view: input.view,
  };
}

export function createGenericTransformContext(input: {
  session: GenericTransformSession;
  anchor: string | null;
  modifiers: CanvasTransformModifiers;
  node: Konva.Group | null;
  setLiveTransform: (transform: Transform | null) => void;
  transformer: Konva.Transformer | null;
}): CanvasTransformContext {
  return {
    anchor: input.anchor,
    layerId: input.session.layerId,
    modifiers: input.modifiers,
    node: input.node,
    setLiveTransform: input.setLiveTransform,
    transform: input.session.transform,
    transformer: input.transformer,
    view: input.session.view,
  };
}

export function applyGenericBoundBoxFunc(input: {
  session: GenericTransformSession;
  anchor: string;
  modifiers: CanvasTransformModifiers;
  node: Konva.Group | null;
  oldBox: CanvasTransformBox;
  newBox: CanvasTransformBox;
  pointerParentLocal: { x: number; y: number } | null;
  setLiveTransform: (transform: Transform | null) => void;
  transformer: Konva.Transformer | null;
}): CanvasTransformBox {
  const boundBoxFunc = input.session.interaction.boundBoxFunc;
  if (!boundBoxFunc) {
    return input.newBox;
  }

  return boundBoxFunc(
    createGenericTransformContext({
      anchor: input.anchor,
      modifiers: input.modifiers,
      node: input.node,
      session: input.session,
      setLiveTransform: input.setLiveTransform,
      transformer: input.transformer,
    }),
    input.oldBox,
    input.newBox,
    input.pointerParentLocal
  );
}
