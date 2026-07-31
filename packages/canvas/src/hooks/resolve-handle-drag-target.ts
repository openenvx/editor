import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import type Konva from 'konva';
import type { RefObject } from 'react';

import { getInteraction } from '../canvas-transformer-utils';
import type { CanvasLayerInteractionRegistration } from '../registry/canvas-registry-types';

interface FlattenedLayerEntry {
  layer: SceneLayer;
  view: LayerPreviewDescriptor;
}

interface HandleDragRef {
  anchor: string;
  layerId: string;
  originTransform: import('@xmazu/openenvxee-schema').Transform;
}

export interface ResolvedHandleDragTarget {
  entry: FlattenedLayerEntry;
  interaction: CanvasLayerInteractionRegistration;
  node: Konva.Group;
  parent: Konva.Container;
  stage: Konva.Stage;
}

export function resolveHandleDragTarget(input: {
  drag: HandleDragRef;
  canvasLayerInteractions: CanvasLayerInteractionRegistration[];
  flattenedLayers: FlattenedLayerEntry[];
  nodeRefs: RefObject<Map<string, Konva.Group>>;
}): ResolvedHandleDragTarget | null {
  const entry = input.flattenedLayers.find(
    ({ layer }) => layer.id === input.drag.layerId
  );
  const node = input.nodeRefs.current?.get(input.drag.layerId);
  const interaction = entry
    ? getInteraction(input.canvasLayerInteractions, entry.view.kind)
    : undefined;
  const stage = node?.getStage();
  const parent = node?.getParent();
  if (!entry || !node || !interaction || !stage || !parent) {
    return null;
  }
  return { entry, interaction, node, parent, stage };
}
