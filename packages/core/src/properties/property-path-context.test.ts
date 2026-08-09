import { normalizeSceneSnapshot } from '@openenvx/core/schema';
import { describe, expect, it, vi } from 'vitest';

import { PropertyPath } from './property-path';
import { createPropertyHostContext } from './property-path-context';

const scene = normalizeSceneSnapshot({
  pages: [
    {
      id: 'p1',
      name: 'Page 1',
      layout: 'absolute',
      width: 800,
      height: 600,
      layers: [
        {
          id: 'a',
          type: 'test',
          data: { text: 'hi' },
          writeMode: 'free',
          showInLayers: true,
        },
      ],
    },
  ],
  templatePolicy: {
    version: 1,
    allowInsertLayers: true,
    allowDeleteLayers: true,
    allowDuplicateLayers: true,
    allowPageResize: true,
  },
}).scene;

describe('createPropertyHostContext', () => {
  it('reads and writes layer data paths', () => {
    const updateProperty = vi.fn();
    const ctx = createPropertyHostContext({
      executeCommand: vi.fn(),
      layerData: { text: 'hi' },
      scene,
      selectedLayerId: 'a',
      updateProperty,
    });
    expect(ctx.readPath(PropertyPath.layerData('text'))).toBe('hi');
    ctx.writePath(PropertyPath.layerData('text'), 'bye');
    expect(updateProperty).toHaveBeenCalledWith('a', 'text', 'bye');
  });

  it('reads layer scalar props and routes writes to scene commands', () => {
    const executeCommand = vi.fn().mockResolvedValue(true);
    const ctx = createPropertyHostContext({
      executeCommand,
      layerData: {},
      scene,
      selectedLayerId: 'a',
      updateProperty: vi.fn(),
    });
    expect(ctx.readPath(PropertyPath.layerProp('writeMode'))).toBe('free');
    expect(ctx.readPath(PropertyPath.layerProp('showInLayers'))).toBe(true);
    ctx.writePath(PropertyPath.layerProp('writeMode'), 'content');
    expect(executeCommand).toHaveBeenCalledWith('scene.setLayerWriteMode', {
      writeMode: 'content',
    });
    ctx.writePath(PropertyPath.layerProp('showInLayers'), false);
    expect(executeCommand).toHaveBeenCalledWith('scene.setLayerShowInLayers', {
      showInLayers: false,
    });
  });

  it('reads and writes templatePolicy flags', () => {
    const executeCommand = vi.fn().mockResolvedValue(true);
    const ctx = createPropertyHostContext({
      executeCommand,
      layerData: null,
      scene,
      selectedLayerId: null,
      updateProperty: vi.fn(),
    });
    expect(ctx.readPath(PropertyPath.templatePolicy('allowInsertLayers'))).toBe(
      true
    );
    ctx.writePath(PropertyPath.templatePolicy('allowInsertLayers'), false);
    expect(executeCommand).toHaveBeenCalledWith('scene.setTemplatePolicy', {
      allowInsertLayers: false,
    });
  });

  it('reads and writes layerById paths without selection', () => {
    const updateProperty = vi.fn();
    const ctx = createPropertyHostContext({
      executeCommand: vi.fn(),
      layerData: null,
      scene,
      selectedLayerId: null,
      updateProperty,
    });
    expect(ctx.readPath(PropertyPath.layerById('a', 'text'))).toBe('hi');
    ctx.writePath(PropertyPath.layerById('a', 'text'), 'bye');
    expect(updateProperty).toHaveBeenCalledWith('a', 'text', 'bye');
  });
});
