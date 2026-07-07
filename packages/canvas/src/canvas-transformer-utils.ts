import type Konva from 'konva';

import type {
  CanvasLayerInteractionRegistration,
} from './registry/canvas-registry-types';

export function getInteraction(
  interactions: CanvasLayerInteractionRegistration[],
  kind: string
): CanvasLayerInteractionRegistration | undefined {
  return interactions.find((entry) => entry.kind === kind);
}

export function attachTransformerToNodes(
  transformer: Konva.Transformer | null,
  nodes: Konva.Group[]
): void {
  if (!transformer) {
    return;
  }
  transformer.nodes(nodes);
  transformer.forceUpdate();
  transformer.getLayer()?.batchDraw();
}

const DEFAULT_TRANSFORMER_ANCHORS = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

export function applyTransformerAnchorVisibility(
  transformer: Konva.Transformer | null,
  activeDragAnchor: string | null,
  richTextAnchors: readonly string[] | null
): void {
  if (!transformer) {
    return;
  }
  if (activeDragAnchor === 'rotater') {
    transformer.enabledAnchors([]);
    transformer.rotateEnabled(true);
  } else if (activeDragAnchor) {
    transformer.enabledAnchors([activeDragAnchor]);
    transformer.rotateEnabled(false);
  } else if (richTextAnchors) {
    transformer.enabledAnchors([...richTextAnchors]);
    transformer.rotateEnabled(true);
  } else {
    transformer.enabledAnchors([...DEFAULT_TRANSFORMER_ANCHORS]);
    transformer.rotateEnabled(true);
  }
  transformer.forceUpdate();
  transformer.getLayer()?.batchDraw();
}
