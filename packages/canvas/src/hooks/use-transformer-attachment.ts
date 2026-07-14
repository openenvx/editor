import type Konva from 'konva';
import { useEffect, useLayoutEffect } from 'react';
import type { RefObject } from 'react';

import {
  attachTransformerToNodes,
  getInteractionAnchors,
} from '../canvas-transformer-utils';
import type { CanvasLayerInteractionRegistration } from '../registry/canvas-registry-types';

export interface UseTransformerAttachmentInput {
  activeDragAnchor: string | null;
  activeHandleAnchor: string | null;
  editingLayerId: string | null;
  isNonEmptyGroupSelected: boolean;
  nodeRefs: RefObject<Map<string, Konva.Group>>;
  selectedInteraction: CanvasLayerInteractionRegistration | undefined;
  selectedLayerIds: string[];
  selectedPrimary: string | null;
  selectedTransform: {
    height: number;
    width: number;
    x: number;
    y: number;
  } | null;
  syncLabelFromTransformer: () => void;
  transformSessionActiveRef: RefObject<boolean>;
  transformerRef: RefObject<Konva.Transformer | null>;
}

export function useTransformerAttachment({
  activeDragAnchor,
  activeHandleAnchor,
  editingLayerId,
  isNonEmptyGroupSelected,
  nodeRefs,
  selectedInteraction,
  selectedLayerIds,
  selectedPrimary,
  selectedTransform,
  syncLabelFromTransformer,
  transformSessionActiveRef,
  transformerRef,
}: UseTransformerAttachmentInput) {
  useEffect(() => {
    if (!transformerRef.current || editingLayerId || activeHandleAnchor) {
      transformerRef.current?.nodes([]);
      return;
    }
    const nodes = selectedLayerIds
      .map((layerId) => nodeRefs.current.get(layerId))
      .filter((node): node is Konva.Group => Boolean(node));
    attachTransformerToNodes(transformerRef.current, nodes);
  }, [
    activeHandleAnchor,
    editingLayerId,
    nodeRefs,
    selectedLayerIds,
    transformerRef,
  ]);

  useLayoutEffect(() => {
    if (
      !selectedPrimary ||
      !selectedTransform ||
      editingLayerId ||
      transformSessionActiveRef.current ||
      activeHandleAnchor
    ) {
      return;
    }
    const nodes = selectedLayerIds
      .map((layerId) => nodeRefs.current.get(layerId))
      .filter((node): node is Konva.Group => Boolean(node));
    attachTransformerToNodes(transformerRef.current, nodes);
    syncLabelFromTransformer();
  }, [
    activeHandleAnchor,
    editingLayerId,
    nodeRefs,
    selectedLayerIds,
    selectedPrimary,
    selectedTransform,
    syncLabelFromTransformer,
    transformSessionActiveRef,
    transformerRef,
  ]);

  const interactionAnchors = getInteractionAnchors(selectedInteraction);
  const transformerEnabledAnchors = activeDragAnchor
    ? activeDragAnchor === 'rotater'
      ? []
      : [activeDragAnchor]
    : isNonEmptyGroupSelected
      ? []
      : interactionAnchors
        ? [...interactionAnchors]
        : undefined;

  return {
    transformerEnabledAnchors,
  };
}
