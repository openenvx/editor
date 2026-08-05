import { describe, expect, it, vi } from 'vitest';

import { createDefaultTransform, normalizeScene } from '@xmazu/openenvxee-schema';

import { createCanvasPropertyHostContext } from './canvas-property-path-context';

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

describe('createCanvasPropertyHostContext', () => {
  it('readPath returns transform values for the selected layer', () => {
    const scene = createSceneWithLayer();
    const ctx = createCanvasPropertyHostContext({
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
    const ctx = createCanvasPropertyHostContext({
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

  it('writePath dispatches rotation to canvas.setLayerRotation', () => {
    const scene = createSceneWithLayer();
    scene.pages[0]!.layers[0]!.transform = {
      ...createDefaultTransform(),
      height: 100,
      rotation: 0,
      width: 200,
      x: 100,
      y: 100,
    };
    const executeCommand = vi.fn();
    const ctx = createCanvasPropertyHostContext({
      scene,
      selectedLayerId: 'layer-1',
      layerData: null,
      updateProperty: vi.fn(),
      executeCommand,
      updateLayerTransform: vi.fn(),
    });

    ctx.writePath('selection.layer.transform.rotation', 90);

    expect(executeCommand).toHaveBeenCalledWith('canvas.setLayerRotation', {
      layerId: 'layer-1',
      rotation: 90,
    });
  });

  it('writePath delegates command paths to executeCommand', () => {
    const scene = createSceneWithLayer();
    const executeCommand = vi.fn();
    const ctx = createCanvasPropertyHostContext({
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

  it('reads and writes active page bleed/safe via commands', () => {
    const scene = createSceneWithLayer();
    const executeCommand = vi.fn();
    const ctx = createCanvasPropertyHostContext({
      scene,
      activePageId: 'page-1',
      selectedLayerId: null,
      layerData: null,
      updateProperty: vi.fn(),
      executeCommand,
      updateLayerTransform: vi.fn(),
    });

    expect(ctx.readPath('scene.activePage.bleedMm')).toBe(0);
    expect(ctx.readPath('scene.activePage.safeMm')).toBe(0);

    ctx.writePath('scene.activePage.bleedMm', 3);
    ctx.writePath('scene.activePage.safeMm', 10);

    expect(executeCommand).toHaveBeenCalledWith('canvas.setBleedMm', {
      bleedMm: 3,
    });
    expect(executeCommand).toHaveBeenCalledWith('canvas.setSafeMm', {
      safeMm: 10,
    });
  });

  it('reads and writes embed layer / templatePolicy paths', () => {
    const scene = createSceneWithLayer();
    scene.pages[0]!.layers[0]!.writeMode = 'content';
    scene.pages[0]!.layers[0]!.showInLayers = false;
    const executeCommand = vi.fn();
    const ctx = createCanvasPropertyHostContext({
      scene,
      selectedLayerId: 'layer-1',
      layerData: null,
      updateProperty: vi.fn(),
      executeCommand,
      updateLayerTransform: vi.fn(),
    });

    expect(ctx.readPath('selection.layer.writeMode')).toBe('content');
    expect(ctx.readPath('selection.layer.showInLayers')).toBe(false);
    expect(ctx.readPath('scene.templatePolicy.allowInsertLayers')).toBe(true);

    ctx.writePath('selection.layer.writeMode', 'locked');
    ctx.writePath('selection.layer.showInLayers', true);
    ctx.writePath('scene.templatePolicy.allowInsertLayers', false);

    expect(executeCommand).toHaveBeenCalledWith('scene.setLayerWriteMode', {
      writeMode: 'locked',
    });
    expect(executeCommand).toHaveBeenCalledWith('scene.setLayerShowInLayers', {
      showInLayers: true,
    });
    expect(executeCommand).toHaveBeenCalledWith('scene.setTemplatePolicy', {
      allowInsertLayers: false,
    });
  });
});
