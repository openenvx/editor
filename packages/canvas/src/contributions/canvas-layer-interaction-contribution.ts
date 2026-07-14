import type {
  CanvasHandleDragContext,
  CanvasHandleLayoutContext,
  CanvasLayerInteractionRegistration,
  CanvasTransformBox,
  CanvasTransformContext,
  CanvasTransformResult,
  HandleDescriptor,
} from '../registry/canvas-registry-types';

export type {
  CanvasHandleDragContext,
  CanvasHandleLayoutContext,
  CanvasInteractionLayoutContext,
  CanvasLayerInteractionRegistration,
  CanvasTransformBox,
  CanvasTransformContext,
  CanvasTransformModifiers,
  CanvasTransformResult,
  HandleDescriptor,
} from '../registry/canvas-registry-types';

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
    layoutHandles: contribution.layoutHandles?.bind(contribution),
    onDoubleClick: contribution.onDoubleClick?.bind(contribution),
    onHandleDragEnd: contribution.onHandleDragEnd?.bind(contribution),
    onHandleDragMove: contribution.onHandleDragMove?.bind(contribution),
    onHandleDragStart: contribution.onHandleDragStart?.bind(contribution),
    onTransform: contribution.onTransform?.bind(contribution),
    onTransformEnd: contribution.onTransformEnd?.bind(contribution),
    onTransformStart: contribution.onTransformStart?.bind(contribution),
    providesHandles: contribution.providesHandles?.bind(contribution),
    usesEditOverlay: contribution.usesEditOverlay,
  };
}

export abstract class CanvasLayerInteractionContribution {
  abstract readonly kind: string;

  readonly usesEditOverlay?: boolean;

  enabledAnchors?(): readonly string[] | null;

  providesHandles?(view: unknown): boolean;

  layoutHandles?(ctx: CanvasHandleLayoutContext): HandleDescriptor[];

  onTransformStart?(ctx: CanvasTransformContext): void;

  onTransform?(ctx: CanvasTransformContext): void;

  onTransformEnd?(ctx: CanvasTransformContext): CanvasTransformResult | void;

  boundBoxFunc?(
    ctx: CanvasTransformContext,
    oldBox: CanvasTransformBox,
    newBox: CanvasTransformBox,
    pointerParentLocal?: { x: number; y: number } | null
  ): CanvasTransformBox;

  onHandleDragStart?(ctx: CanvasHandleDragContext): void;

  onHandleDragMove?(
    ctx: CanvasHandleDragContext,
    pointerParentLocal: { x: number; y: number }
  ): void;

  onHandleDragEnd?(ctx: CanvasHandleDragContext): CanvasTransformResult | void;

  hideContentDuringTransform?(layerId: string): boolean;

  hideContentDuringEdit?(
    editingLayerId: string | null,
    layerId: string
  ): boolean;

  onDoubleClick?(layerId: string): void;
}
