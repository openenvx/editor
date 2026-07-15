import { describe, expect, it, vi } from 'vitest';

import { createDefaultTransform, normalizeScene } from '@openenvx/schema';

import { createCanvasInspectorHostContext } from './canvas-inspector-path-context';

function createSceneWithLayer() {
  const transform = {
    ...createDefaultTransform(),
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    rotation: 45,
  };

  return normalizeScene({
    activePageId: 'page-1',
    pages: [
      {
        id: 'page-1',
        name: 'Page',
        layout: 'absolute',
        width: 800,
        height: 600,
        layers: [
          {
            id: 'layer-1',
            type: 'canvas.rect',
            data: { fill: '#000' },
            transform,
          },
        ],
      },
    ],
    selection: {
      activePageId: 'page-1',
      selectedLayerIds: ['layer-1'],
      primaryLayerId: 'layer-1',
    },
  });
}

describe('createCanvasInspectorHostContext', () => {
  it('readPath returns transform values for the selected layer', () => {
    const scene = createSceneWithLayer();
    const ctx = createCanvasInspectorHostContext({
      scene,
      selectedLayerId: 'layer-1',
      layerData: null,
      updateProperty: vi.fn(),
      executeCommand: vi.fn(),
      updateLayerTransform: vi.fn(),
    });

    expect(ctx.readPath('selection.layer.transform.x')).toBe(10);
    expect(ctx.readPath('selection.layer.transform.y')).toBe(20);
    expect(ctx.readPath('selection.layer.transform.width')).toBe(100);
    expect(ctx.readPath('selection.layer.transform.height')).toBe(50);
    expect(ctx.readPath('selection.layer.transform.rotation')).toBe(45);
  });

  it('writePath patches transform and calls updateLayerTransform', () => {
    const scene = createSceneWithLayer();
    const updateLayerTransform = vi.fn();
    const ctx = createCanvasInspectorHostContext({
      scene,
      selectedLayerId: 'layer-1',
      layerData: null,
      updateProperty: vi.fn(),
      executeCommand: vi.fn(),
      updateLayerTransform,
    });

    ctx.writePath('selection.layer.transform.x', 30);

    expect(updateLayerTransform).toHaveBeenCalledWith('layer-1', {
      ...createDefaultTransform(),
      x: 30,
      y: 20,
      width: 100,
      height: 50,
      rotation: 45,
    });
  });

  it('writePath delegates command paths to executeCommand', () => {
    const scene = createSceneWithLayer();
    const executeCommand = vi.fn();
    const ctx = createCanvasInspectorHostContext({
      scene,
      selectedLayerId: 'layer-1',
      layerData: null,
      updateProperty: vi.fn(),
      executeCommand,
      updateLayerTransform: vi.fn(),
    });

    ctx.writePath('command.canvas.rotateLeft', null);

    expect(executeCommand).toHaveBeenCalledWith('canvas.rotateLeft');
  });
});
