import {
  EditorService,
  InstantiationService,
  SceneStore,
  WorkbenchEventService,
} from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import { createDefaultTransform, normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { UpdateLayerTransformCommand } from './canvas-api-commands';

function createContext(sceneStore: SceneStore): CommandContext {
  return {
    editor: new EditorService(),
    events: new WorkbenchEventService(),
    scene: sceneStore,
    selection: sceneStore.getSelection(),
    services: new InstantiationService(),
  };
}

describe('UpdateLayerTransformCommand dataPatch', () => {
  it('merges dataPatch and updates transform', () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: { alt: 'Alt', assetRef: 'asset://image.png' },
              id: 'image-1',
              transform: {
                ...createDefaultTransform(),
                height: 200,
                width: 300,
              },
              type: 'canvas.image',
            },
          ],
          name: 'Page',
        },
      ],
      selection: {
        activePageId: 'p1',
        primaryLayerId: 'image-1',
        selectedLayerIds: ['image-1'],
      },
    });
    const store = new SceneStore(scene);
    const command = new UpdateLayerTransformCommand();

    command.execute(createContext(store), {
      dataPatch: {
        crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
      },
      layerId: 'image-1',
      transform: {
        ...createDefaultTransform(),
        height: 100,
        width: 150,
      },
    });

    const layer = store.getScene().pages[0]!.layers[0]!;
    expect(layer.data).toEqual({
      alt: 'Alt',
      assetRef: 'asset://image.png',
      crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
    });
    expect(layer.transform).toEqual({
      ...createDefaultTransform(),
      height: 100,
      width: 150,
    });
  });

  it('deletes data keys when patch value is undefined', () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: {
                alt: 'Alt',
                assetRef: 'asset://image.png',
                crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
              },
              id: 'image-1',
              transform: createDefaultTransform(),
              type: 'canvas.image',
            },
          ],
          name: 'Page',
        },
      ],
      selection: {
        activePageId: 'p1',
        primaryLayerId: 'image-1',
        selectedLayerIds: ['image-1'],
      },
    });
    const store = new SceneStore(scene);
    const command = new UpdateLayerTransformCommand();

    command.execute(createContext(store), {
      dataPatch: {
        crop: undefined,
      },
      layerId: 'image-1',
      transform: createDefaultTransform(),
    });

    const layer = store.getScene().pages[0]!.layers[0]!;
    expect(layer.data).toEqual({
      alt: 'Alt',
      assetRef: 'asset://image.png',
    });
  });
});
