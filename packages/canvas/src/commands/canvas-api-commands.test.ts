import {
  EditorService,
  InstantiationService,
  SceneStore,
  WorkbenchEventService,
} from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import { createDefaultTransform, normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  RotateLayerRightCommand,
  SetLayerRotationCommand,
  UpdateLayerTransformCommand,
} from './canvas-api-commands';

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

describe('UpdateLayerTransformCommand group child isolation', () => {
  it('updates only the moved child — siblings and group origin stay put', () => {
    const siblingTransform = {
      ...createDefaultTransform(),
      height: 40,
      width: 40,
      x: 100,
      y: 10,
    };
    const groupTransform = {
      ...createDefaultTransform(),
      height: 200,
      width: 300,
      x: 50,
      y: 50,
    };
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: {
                children: [
                  {
                    data: { fill: '#000' },
                    id: 'child-a',
                    transform: {
                      ...createDefaultTransform(),
                      height: 40,
                      width: 40,
                      x: 0,
                      y: 0,
                    },
                    type: 'canvas.rect',
                  },
                  {
                    data: { fill: '#111' },
                    id: 'child-b',
                    transform: siblingTransform,
                    type: 'canvas.rect',
                  },
                ],
              },
              id: 'group-1',
              transform: groupTransform,
              type: 'canvas.group',
            },
          ],
          name: 'Page',
        },
      ],
      selection: {
        activePageId: 'p1',
        primaryLayerId: 'child-a',
        selectedLayerIds: ['child-a'],
      },
    });
    const store = new SceneStore(scene);
    const command = new UpdateLayerTransformCommand();

    command.execute(createContext(store), {
      layerId: 'child-a',
      transform: {
        ...createDefaultTransform(),
        height: 40,
        width: 40,
        x: -30,
        y: -20,
      },
    });

    const group = store.getScene().pages[0]!.layers[0]!;
    const children = (group.data as { children: typeof scene.pages[0]['layers'] })
      .children;
    expect(group.transform).toMatchObject(groupTransform);
    expect(children[0]?.transform).toMatchObject({ x: -30, y: -20 });
    expect(children[1]?.transform).toMatchObject(siblingTransform);
  });
});

describe('SetLayerRotationCommand', () => {
  it('rotates around center and updates position', () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: { fill: '#000' },
              id: 'rect-1',
              transform: {
                ...createDefaultTransform(),
                height: 100,
                width: 200,
                x: 100,
                y: 100,
              },
              type: 'canvas.rect',
            },
          ],
          name: 'Page',
        },
      ],
    });
    const store = new SceneStore(scene, {
      activePageId: 'p1',
      primaryLayerId: 'rect-1',
      selectedLayerIds: ['rect-1'],
    });
    new SetLayerRotationCommand().execute(createContext(store), {
      layerId: 'rect-1',
      rotation: 90,
    });

    const transform = store.getScene().pages[0]!.layers[0]!.transform!;
    expect(transform.rotation).toBe(90);
    expect(transform.x).toBeCloseTo(250);
    expect(transform.y).toBeCloseTo(50);
  });
});

describe('RotateLayerRightCommand', () => {
  it('rotates around center and updates position', () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: { fill: '#000' },
              id: 'rect-1',
              transform: {
                ...createDefaultTransform(),
                height: 100,
                width: 200,
                x: 100,
                y: 100,
              },
              type: 'canvas.rect',
            },
          ],
          name: 'Page',
        },
      ],
    });
    const store = new SceneStore(scene, {
      activePageId: 'p1',
      primaryLayerId: 'rect-1',
      selectedLayerIds: ['rect-1'],
    });
    new RotateLayerRightCommand().execute(createContext(store));

    const transform = store.getScene().pages[0]!.layers[0]!.transform!;
    expect(transform.rotation).toBe(90);
    expect(transform.x).toBeCloseTo(250);
    expect(transform.y).toBeCloseTo(50);
  });
});
