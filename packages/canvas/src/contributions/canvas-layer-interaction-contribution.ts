import type {
  CanvasLayerInteractionRegistration,
  CanvasTransformBox,
  CanvasTransformContext,
  CanvasTransformResult,
} from '../registry/canvas-registry-types';

export type {
  CanvasLayerInteractionRegistration,
  CanvasTransformBox,
  CanvasTransformContext,
  CanvasTransformResult,
};

export function toCanvasLayerInteractionRegistration(
  contribution: CanvasLayerInteractionContribution
): CanvasLayerInteractionRegistration {
  return {
    boundBoxFunc: contribution.boundBoxFunc?.bind(contribution),
    enabledAnchors: contribution.enabledAnchors?.bind(contribution),
    hideContentDuringEdit:
      contribution.hideContentDuringEdit?.bind(contribution),
    hideContentDuringTransform:
      contribution.hideContentDuringTransform?.bind(contribution),
    kind: contribution.kind,
    onDoubleClick: contribution.onDoubleClick?.bind(contribution),
    onTransform: contribution.onTransform?.bind(contribution),
    onTransformEnd: contribution.onTransformEnd?.bind(contribution),
    onTransformStart: contribution.onTransformStart?.bind(contribution),
    usesEditOverlay: contribution.usesEditOverlay,
  };
}

export abstract class CanvasLayerInteractionContribution {
  abstract readonly kind: string;

  readonly usesEditOverlay?: boolean;

  enabledAnchors?(): readonly string[] | null;

  onTransformStart?(ctx: CanvasTransformContext): void;

  onTransform?(ctx: CanvasTransformContext): void;

  onTransformEnd?(ctx: CanvasTransformContext): CanvasTransformResult | void;

  boundBoxFunc?(
    ctx: CanvasTransformContext,
    oldBox: CanvasTransformBox,
    newBox: CanvasTransformBox
  ): CanvasTransformBox;

  hideContentDuringTransform?(layerId: string): boolean;

  hideContentDuringEdit?(
    editingLayerId: string | null,
    layerId: string
  ): boolean;

  onDoubleClick?(layerId: string): void;
}
