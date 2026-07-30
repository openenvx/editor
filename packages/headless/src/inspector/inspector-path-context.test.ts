import { normalizeSceneSnapshot } from '@openenvx/schema';
import { describe, expect, it, vi } from 'vitest';

import { InspectorPath } from './inspector-path';
import { createInspectorHostContext } from './inspector-path-context';

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

describe('createInspectorHostContext', () => {
  it('reads and writes layer data paths', () => {
    const updateProperty = vi.fn();
    const ctx = createInspectorHostContext({
      executeCommand: vi.fn(),
      layerData: { text: 'hi' },
      scene,
      selectedLayerId: 'a',
      updateProperty,
    });
    expect(ctx.readPath(InspectorPath.layerData('text'))).toBe('hi');
    ctx.writePath(InspectorPath.layerData('text'), 'bye');
    expect(updateProperty).toHaveBeenCalledWith('a', 'text', 'bye');
  });

  it('reads layer scalar props and routes writes to scene commands', () => {
    const executeCommand = vi.fn().mockResolvedValue(true);
    const ctx = createInspectorHostContext({
      executeCommand,
      layerData: {},
      scene,
      selectedLayerId: 'a',
      updateProperty: vi.fn(),
    });
    expect(ctx.readPath(InspectorPath.layerProp('writeMode'))).toBe('free');
    expect(ctx.readPath(InspectorPath.layerProp('showInLayers'))).toBe(true);
    ctx.writePath(InspectorPath.layerProp('writeMode'), 'content');
    expect(executeCommand).toHaveBeenCalledWith('scene.setLayerWriteMode', {
      writeMode: 'content',
    });
    ctx.writePath(InspectorPath.layerProp('showInLayers'), false);
    expect(executeCommand).toHaveBeenCalledWith('scene.setLayerShowInLayers', {
      showInLayers: false,
    });
  });

  it('reads and writes templatePolicy flags', () => {
    const executeCommand = vi.fn().mockResolvedValue(true);
    const ctx = createInspectorHostContext({
      executeCommand,
      layerData: null,
      scene,
      selectedLayerId: null,
      updateProperty: vi.fn(),
    });
    expect(ctx.readPath(InspectorPath.templatePolicy('allowInsertLayers'))).toBe(
      true
    );
    ctx.writePath(InspectorPath.templatePolicy('allowInsertLayers'), false);
    expect(executeCommand).toHaveBeenCalledWith('scene.setTemplatePolicy', {
      allowInsertLayers: false,
    });
  });
});
