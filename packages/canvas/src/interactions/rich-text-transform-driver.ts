import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { createDefaultTransform } from '@openenvx/schema';
import type { Transform } from '@openenvx/schema';
import type Konva from 'konva';

import {
  createTransformDragContext,
  createTransformDragContextFromOrigin,
} from '../geometry';
import type { TransformDragContext } from '../geometry';
import { applyRichTextToGroup } from '../rich-text-konva-driver';
import { measureRichTextHeight } from '../rich-text-layout';
import {
  computeCornerResize,
  computeHorizontalResize,
  computeHorizontalResizeFromNode,
  constrainRichTextHorizontalBox,
  isRichTextHorizontalAnchor,
} from '../rich-text-resize';
import type {
  RichTextResizeAnchor,
  RichTextResizeResult,
} from '../rich-text-resize';
import {
  bakeRichTextNodeTransform,
  RICH_TEXT_ENABLED_ANCHORS,
} from '../rich-text-transform';
import {
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
} from '../rich-text-typography';

export type RichTextView = Extract<
  LayerPreviewDescriptor,
  { kind: 'richText' }
>;

export interface RichTextCornerSession {
  fontSize: number;
  layerId: string;
  origin: Transform;
  transform: Transform;
  view: RichTextView;
}

export interface RichTextTransformRuntime {
  layerId: string;
  view: RichTextView;
  node: Konva.Group;
  transformer: Konva.Transformer | null;
  transform: Transform;
  anchor: string | null;
  sessionRef: { current: RichTextCornerSession | null };
  dragRef: { current: TransformDragContext | null };
  bakeInProgressRef: { current: boolean };
  cornerBakeRafRef: { current: number | null };
  nodeRefs: Map<string, Konva.Group>;
  onUpdateSizeLabel: (bounds: {
    height: number;
    width: number;
    x: number;
    y: number;
  }) => void;
}

function pointerToParentLocal(
  stage: Konva.Stage,
  parent: Konva.Container
): { x: number; y: number } | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }
  return parent.getAbsoluteTransform().copy().invert().point(pointer);
}

function measureRichTextHeightForView(
  view: RichTextView,
  width: number,
  fontSize: number
): number {
  return measureRichTextHeight({
    align: view.align,
    fontFamily: view.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY,
    fontSize,
    html: view.html,
    letterSpacing: view.letterSpacing,
    lineHeightMultiplier: view.lineHeight,
    width,
  });
}

export function startRichTextTransform(
  runtime: RichTextTransformRuntime
): void {
  const { anchor, node, sessionRef, dragRef, transformer, transform, view } =
    runtime;
  const capturedTransform = {
    ...transform,
    height: node.height(),
    rotation: node.rotation(),
    width: node.width(),
    x: node.x(),
    y: node.y(),
  };
  const fontSize = view.fontSize ?? DEFAULT_RICH_TEXT_FONT_SIZE;
  sessionRef.current = {
    fontSize,
    layerId: runtime.layerId,
    origin: capturedTransform,
    transform: capturedTransform,
    view,
  };
  applyRichTextToGroup(node, view, capturedTransform, fontSize);

  if (transformer && anchor) {
    dragRef.current = isRichTextHorizontalAnchor(anchor)
      ? createTransformDragContextFromOrigin(anchor, capturedTransform, node)
      : createTransformDragContext(transformer);
  } else {
    dragRef.current = transformer
      ? createTransformDragContext(transformer)
      : null;
  }
}

export function endRichTextTransformSession(runtime: {
  sessionRef: { current: RichTextCornerSession | null };
  cornerBakeRafRef: { current: number | null };
}): void {
  runtime.sessionRef.current = null;
  if (runtime.cornerBakeRafRef.current !== null) {
    cancelAnimationFrame(runtime.cornerBakeRafRef.current);
    runtime.cornerBakeRafRef.current = null;
  }
}

export function boundRichTextBox(
  session: RichTextCornerSession,
  anchor: string,
  oldBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  },
  newBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  },
  pointer: { x: number; y: number } | null
) {
  return constrainRichTextHorizontalBox(
    {
      anchor: anchor as RichTextResizeAnchor,
      origin: session.origin,
      snapshot: session.transform,
      startFontSize: session.fontSize,
    },
    oldBox,
    newBox,
    (width, fontSize) =>
      measureRichTextHeightForView(session.view, width, fontSize),
    pointer
  );
}

export function runRichTextLiveBake(runtime: RichTextTransformRuntime): void {
  const {
    bakeInProgressRef,
    cornerBakeRafRef,
    dragRef,
    layerId,
    nodeRefs,
    onUpdateSizeLabel,
    sessionRef,
    view,
  } = runtime;

  const runBake = () => {
    if (bakeInProgressRef.current) {
      return;
    }
    bakeInProgressRef.current = true;
    try {
      const session = sessionRef.current;
      const node = nodeRefs.get(layerId);
      const anchor = dragRef.current?.anchor ?? 'bottom-right';
      if (!session || !node || session.layerId !== layerId) {
        return;
      }

      const resizeSession = {
        anchor: anchor as RichTextResizeAnchor,
        origin: session.origin,
        snapshot: session.transform,
        startFontSize: session.fontSize,
      };
      const nodeState = {
        height: node.height(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        width: node.width(),
        x: node.x(),
        y: node.y(),
      };
      const measureHeight = (width: number, fontSize: number) =>
        measureRichTextHeightForView(view, width, fontSize);

      let result: RichTextResizeResult;
      if (isRichTextHorizontalAnchor(anchor)) {
        const stage = node.getStage();
        const parent = node.getParent();
        const pointer =
          stage && parent ? pointerToParentLocal(stage, parent) : null;
        result = pointer
          ? computeHorizontalResize(resizeSession, pointer, measureHeight)
          : computeHorizontalResizeFromNode(
              resizeSession,
              nodeState,
              measureHeight
            );
      } else {
        result = computeCornerResize(resizeSession, nodeState, measureHeight);
      }

      applyRichTextToGroup(node, view, result.transform, result.fontSize);
      sessionRef.current = {
        fontSize: result.fontSize,
        layerId,
        origin: session.origin,
        transform: result.transform,
        view: session.view,
      };
      onUpdateSizeLabel({
        height: result.transform.height,
        width: result.transform.width,
        x: result.transform.x,
        y: result.transform.y,
      });
      runtime.transformer?.forceUpdate();
      runtime.transformer?.getLayer()?.batchDraw();
    } finally {
      bakeInProgressRef.current = false;
    }
  };

  if (isRichTextHorizontalAnchor(dragRef.current?.anchor ?? '')) {
    runBake();
    return;
  }

  if (cornerBakeRafRef.current !== null) {
    return;
  }
  cornerBakeRafRef.current = requestAnimationFrame(() => {
    cornerBakeRafRef.current = null;
    runBake();
  });
}

export function bakeRichTextTransformEnd(
  runtime: RichTextTransformRuntime,
  node: Konva.Group
): { transform: Transform; fontSize?: number } | null {
  const session = runtime.sessionRef.current;
  if (!session || session.layerId !== runtime.layerId) {
    return null;
  }
  const anchor = runtime.dragRef.current?.anchor ?? 'bottom-right';
  const result = bakeRichTextNodeTransform(
    {
      anchor: anchor as RichTextResizeAnchor,
      origin: session.origin,
      snapshot: session.transform,
      startFontSize: session.fontSize,
    },
    node,
    (width, fontSize) =>
      measureRichTextHeightForView(session.view, width, fontSize)
  );
  node.destroyChildren();
  node.getLayer()?.batchDraw();
  return { fontSize: result.fontSize, transform: result.transform };
}

export function createRichTextTransformRuntime(
  layerId: string,
  view: RichTextView,
  layerTransform: Transform | undefined,
  node: Konva.Group,
  transformer: Konva.Transformer | null,
  anchor: string | null,
  refs: Pick<
    RichTextTransformRuntime,
    | 'sessionRef'
    | 'dragRef'
    | 'bakeInProgressRef'
    | 'cornerBakeRafRef'
    | 'nodeRefs'
    | 'onUpdateSizeLabel'
  >
): RichTextTransformRuntime {
  return {
    anchor,
    layerId,
    node,
    transform: layerTransform ?? createDefaultTransform(),
    transformer,
    view,
    ...refs,
  };
}

export { RICH_TEXT_ENABLED_ANCHORS };
