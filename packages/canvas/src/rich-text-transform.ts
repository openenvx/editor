import type { Transform } from '@xmazu/openenvxee-schema';
import type Konva from 'konva';

import { applyTransformToNode } from './geometry';
import {
  computeCornerResize,
  computeHorizontalResizeFromNode,
  isRichTextHorizontalAnchor,
  RICH_TEXT_CORNER_ANCHORS,
  RICH_TEXT_HORIZONTAL_ANCHORS,
} from './rich-text-resize';
import type { RichTextResizeSession } from './rich-text-resize';

export {
  MIN_RICH_TEXT_FONT_SIZE,
  RICH_TEXT_CORNER_ANCHORS,
  RICH_TEXT_HORIZONTAL_ANCHORS,
} from './rich-text-resize';

export const RICH_TEXT_ENABLED_ANCHORS = [
  ...RICH_TEXT_CORNER_ANCHORS,
  ...RICH_TEXT_HORIZONTAL_ANCHORS,
] as const;

export interface BakeRichTextResult {
  fontSize: number;
  transform: Transform;
}

export function bakeRichTextNodeTransform(
  session: RichTextResizeSession,
  node: Konva.Group,
  measureHeight: (width: number, fontSize: number) => number
): BakeRichTextResult {
  const nodeState = {
    height: node.height(),
    rotation: node.rotation(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    width: node.width(),
    x: node.x(),
    y: node.y(),
  };
  const result = isRichTextHorizontalAnchor(session.anchor)
    ? computeHorizontalResizeFromNode(session, nodeState, measureHeight)
    : computeCornerResize(session, nodeState, measureHeight);
  applyTransformToNode(node, result.transform);
  return result;
}
