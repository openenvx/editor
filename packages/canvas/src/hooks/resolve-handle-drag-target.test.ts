import type { Layer as SceneLayer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import type Konva from 'konva';
import { describe, expect, it } from 'vitest';

import { resolveHandleDragTarget } from './resolve-handle-drag-target';
import type { CanvasLayerInteractionRegistration } from '../registry/canvas-registry-types';

function createInteraction(kind: string): CanvasLayerInteractionRegistration {
  return { kind };
}

describe('resolveHandleDragTarget', () => {
  const layer: SceneLayer = {
    id: 'layer-1',
    name: 'Layer',
    transform: createDefaultTransform(),
    type: 'canvasImage',
    visible: true,
  };
  const view: LayerPreviewDescriptor = {
    assetId: 'asset-1',
    kind: 'image',
  };
  const flattenedLayers = [{ layer, view }];

  it('returns null when the layer entry is missing', () => {
    const result = resolveHandleDragTarget({
      canvasLayerInteractions: [createInteraction('image')],
      drag: {
        anchor: 'top-left',
        layerId: 'missing',
        originTransform: createDefaultTransform(),
      },
      flattenedLayers,
      nodeRefs: { current: new Map() },
    });

    expect(result).toBeNull();
  });

  it('returns null when the node is missing', () => {
    const result = resolveHandleDragTarget({
      canvasLayerInteractions: [createInteraction('image')],
      drag: {
        anchor: 'top-left',
        layerId: 'layer-1',
        originTransform: createDefaultTransform(),
      },
      flattenedLayers,
      nodeRefs: { current: new Map() },
    });

    expect(result).toBeNull();
  });

  it('returns the resolved target when entry, node, and interaction exist', () => {
    const stage = { id: 'stage' } as unknown as Konva.Stage;
    const parent = { id: 'parent' } as unknown as Konva.Container;
    const node = {
      getParent: () => parent,
      getStage: () => stage,
    } as unknown as Konva.Group;

    const result = resolveHandleDragTarget({
      canvasLayerInteractions: [createInteraction('image')],
      drag: {
        anchor: 'top-left',
        layerId: 'layer-1',
        originTransform: createDefaultTransform(),
      },
      flattenedLayers,
      nodeRefs: { current: new Map([['layer-1', node]]) },
    });

    expect(result).toEqual({
      entry: flattenedLayers[0],
      interaction: createInteraction('image'),
      node,
      parent,
      stage,
    });
  });

  it('returns null when interaction is not registered for the view kind', () => {
    const stage = { id: 'stage' } as unknown as Konva.Stage;
    const parent = { id: 'parent' } as unknown as Konva.Container;
    const node = {
      getParent: () => parent,
      getStage: () => stage,
    } as unknown as Konva.Group;

    const result = resolveHandleDragTarget({
      canvasLayerInteractions: [createInteraction('richText')],
      drag: {
        anchor: 'top-left',
        layerId: 'layer-1',
        originTransform: createDefaultTransform(),
      },
      flattenedLayers,
      nodeRefs: { current: new Map([['layer-1', node]]) },
    });

    expect(result).toBeNull();
  });
});
