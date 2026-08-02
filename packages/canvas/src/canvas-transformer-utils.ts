import type Konva from 'konva';
import type { RefObject } from 'react';

import { ROTATER_ANCHOR } from './geometry';
import type { CanvasLayerInteractionRegistration } from './registry/canvas-registry-types';

export function refreshTransformer(
  transformer: Konva.Transformer | null
): void {
  transformer?.forceUpdate();
  transformer?.getLayer()?.batchDraw();
}

export function getInteraction(
  interactions: CanvasLayerInteractionRegistration[],
  kind: string
): CanvasLayerInteractionRegistration | undefined {
  return interactions.find((entry) => entry.kind === kind);
}

export function getInteractionAnchors(
  interaction: CanvasLayerInteractionRegistration | undefined
): readonly string[] | null | undefined {
  return interaction?.enabledAnchors?.();
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

export function reattachTransformerFromSelection(
  nodeRefs: RefObject<Map<string, Konva.Group>>,
  selectedLayerIdsRef: RefObject<string[]>,
  transformerRef: RefObject<Konva.Transformer | null>,
  syncLabelFromTransformer: () => void
): void {
  requestAnimationFrame(() => {
    const nodes = (selectedLayerIdsRef.current ?? [])
      .map((id) => nodeRefs.current?.get(id))
      .filter((entryNode): entryNode is Konva.Group => Boolean(entryNode));
    attachTransformerToNodes(transformerRef.current, nodes);
    syncLabelFromTransformer();
  });
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
  if (activeDragAnchor === ROTATER_ANCHOR) {
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
