/**
 * Live rich-text transforms are pointer-driven (see rich-text-resize /
 * rich-text-interaction-contracts). Konva Transformer scale must never be the
 * source of truth during a corner/edge bake — otherwise bake + Transformer
 * fight and the box jumps.
 */
import type { LayerPreviewDescriptor } from '@openenvx/core/preview';
import { createDefaultTransform } from '@openenvx/core/schema';
import type { Transform } from '@openenvx/core/schema';
import type Konva from 'konva';

import { refreshTransformer } from '../canvas-transformer-utils';
import {
  createTransformDragContext,
  createTransformDragContextFromOrigin,
} from '../geometry';
import type { TransformDragContext } from '../geometry';
import { applyRichTextToGroup } from '../rich-text-konva-driver';
import { measureRichTextHeight } from '../rich-text-layout';
import {
  computeCornerResize,
  computeCornerResizeFromPointer,
  computeHorizontalResize,
  computeHorizontalResizeFromNode,
  constrainRichTextCornerBox,
  constrainRichTextHorizontalBox,
  isRichTextCornerAnchor,
  isRichTextHorizontalAnchor,
  isRichTextResizeAnchor,
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
  /** Immutable font size at drag start — never overwrite during live bake. */
  startFontSize: number;
  layerId: string;
  origin: Transform;
  /** Last baked transform (for end-of-drag fallback). */
  transform: Transform;
  view: RichTextView;
}

export interface RichTextTransformRuntime {
  layerId: string;
  view: RichTextView;
  node: Konva.Group;
  transformer: Konva.Transformer | null;
  transform: Transform;
  /** Active transformer handle at drag start (includes rotater). */
  anchor: string | null;
  /** Resize handle when this drag is a corner/edge bake; null for rotation. */
  resizeAnchor: RichTextResizeAnchor | null;
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

function resizeSessionFrom(
  session: RichTextCornerSession,
  anchor: RichTextResizeAnchor
): {
  anchor: RichTextResizeAnchor;
  origin: Transform;
  startFontSize: number;
} {
  return {
    anchor,
    origin: session.origin,
    startFontSize: session.startFontSize,
  };
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
  const startFontSize = view.fontSize ?? DEFAULT_RICH_TEXT_FONT_SIZE;
  sessionRef.current = {
    layerId: runtime.layerId,
    origin: capturedTransform,
    startFontSize,
    transform: capturedTransform,
    view,
  };
  // Reset any leftover Konva scale before the drag owns the node.
  applyRichTextToGroup(node, view, capturedTransform, startFontSize);

  if (transformer && anchor) {
    dragRef.current = createTransformDragContextFromOrigin(
      anchor,
      capturedTransform,
      node
    );
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
  const resizeSession = resizeSessionFrom(
    session,
    anchor as RichTextResizeAnchor
  );
  const measure = (width: number, fontSize: number) =>
    measureRichTextHeightForView(session.view, width, fontSize);

  if (isRichTextCornerAnchor(anchor)) {
    return constrainRichTextCornerBox(
      resizeSession,
      oldBox,
      newBox,
      measure,
      pointer
    );
  }

  return constrainRichTextHorizontalBox(
    resizeSession,
    oldBox,
    newBox,
    measure,
    pointer
  );
}

export function runRichTextLiveBake(runtime: RichTextTransformRuntime): void {
  const {
    bakeInProgressRef,
    cornerBakeRafRef,
    layerId,
    nodeRefs,
    onUpdateSizeLabel,
    sessionRef,
    view,
  } = runtime;

  // Drop any pending RAF from older corner-bake path.
  if (cornerBakeRafRef.current !== null) {
    cancelAnimationFrame(cornerBakeRafRef.current);
    cornerBakeRafRef.current = null;
  }

  // Konva.Transformer owns rotation; pointer-driven resize bake must not run.
  if (!runtime.resizeAnchor) {
    return;
  }

  if (bakeInProgressRef.current) {
    return;
  }
  bakeInProgressRef.current = true;
  try {
    const session = sessionRef.current;
    const node = nodeRefs.get(layerId);
    if (!session || !node || session.layerId !== layerId) {
      return;
    }

    const resizeSession = resizeSessionFrom(session, runtime.resizeAnchor);
    const measureHeight = (width: number, fontSize: number) =>
      measureRichTextHeightForView(view, width, fontSize);

    const stage = node.getStage();
    const parent = node.getParent();
    const pointer =
      stage && parent ? pointerToParentLocal(stage, parent) : null;

    const anchor = runtime.resizeAnchor;
    let result: RichTextResizeResult;
    if (isRichTextHorizontalAnchor(anchor)) {
      const nodeState = {
        height: node.height(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        width: node.width(),
        x: node.x(),
        y: node.y(),
      };
      result = pointer
        ? computeHorizontalResize(resizeSession, pointer, measureHeight)
        : computeHorizontalResizeFromNode(
            resizeSession,
            nodeState,
            measureHeight
          );
    } else {
      result = pointer
        ? computeCornerResizeFromPointer(resizeSession, pointer, measureHeight)
        : computeCornerResize(
            resizeSession,
            {
              height: node.height(),
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
              width: node.width(),
              x: node.x(),
              y: node.y(),
            },
            measureHeight
          );
    }

    applyRichTextToGroup(node, view, result.transform, result.fontSize);
    sessionRef.current = {
      ...session,
      transform: result.transform,
    };
    onUpdateSizeLabel({
      height: result.transform.height,
      width: result.transform.width,
      x: result.transform.x,
      y: result.transform.y,
    });
    refreshTransformer(runtime.transformer);
  } finally {
    bakeInProgressRef.current = false;
  }
}

export function bakeRichTextTransformEnd(
  runtime: RichTextTransformRuntime,
  node: Konva.Group
): { transform: Transform; fontSize?: number } | null {
  const session = runtime.sessionRef.current;
  if (!session || session.layerId !== runtime.layerId) {
    return null;
  }
  if (!runtime.resizeAnchor) {
    node.destroyChildren();
    node.getLayer()?.batchDraw();
    return null;
  }
  const anchor = runtime.resizeAnchor;
  const stage = node.getStage();
  const parent = node.getParent();
  const pointer = stage && parent ? pointerToParentLocal(stage, parent) : null;
  const resizeSession = resizeSessionFrom(session, anchor);
  const measureHeight = (width: number, fontSize: number) =>
    measureRichTextHeightForView(session.view, width, fontSize);

  let result: RichTextResizeResult;
  if (pointer && isRichTextCornerAnchor(anchor)) {
    result = computeCornerResizeFromPointer(
      resizeSession,
      pointer,
      measureHeight
    );
    applyRichTextToGroup(node, session.view, result.transform, result.fontSize);
  } else if (pointer && isRichTextHorizontalAnchor(anchor)) {
    result = computeHorizontalResize(resizeSession, pointer, measureHeight);
    applyRichTextToGroup(node, session.view, result.transform, result.fontSize);
  } else {
    result = bakeRichTextNodeTransform(resizeSession, node, measureHeight);
  }

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
  const resizeAnchor = anchor && isRichTextResizeAnchor(anchor) ? anchor : null;
  return {
    anchor,
    layerId,
    node,
    resizeAnchor,
    transform: layerTransform ?? createDefaultTransform(),
    transformer,
    view,
    ...refs,
  };
}

export { RICH_TEXT_ENABLED_ANCHORS };
