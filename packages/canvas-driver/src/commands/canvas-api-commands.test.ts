import {
  EditorService,
  getLayerChildren,
  InstantiationService,
  SceneStore,
  WorkbenchEventService,
  type CommandContext,
} from '@openenvx/studio';
import { createDefaultFrame, nodeTransform } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  RotateLayerRightCommand,
  SetLayerRotationCommand,
  UpdateLayerTransformCommand,
} from './canvas-api-commands';
import {
  legacyLayer,
  testArtboard,
  testDocument,
} from '../test/canvas-document-fixtures';

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
    const scene = testDocument([
      testArtboard({
        id: 'p1',
        nodes: [
          legacyLayer({
            data: { alt: 'Alt', assetRef: 'asset://image.png' },
            id: 'image-1',
            transform: {
              ...createDefaultFrame(),
              height: 200,
              width: 300,
            },
            type: 'canvas.image',
          }),
        ],
      }),
    ]);
    const store = new SceneStore(scene, {
      activeArtboardId: 'p1',
      primaryNodeId: 'image-1',
      selectedNodeIds: ['image-1'],
    });
    const command = new UpdateLayerTransformCommand();

    command.execute(createContext(store), {
      dataPatch: {
        crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
      },
      layerId: 'image-1',
      transform: {
        ...createDefaultFrame(),
        height: 100,
        width: 150,
      },
    });

    const layer = store.getScene().artboards[0]!.nodes[0]!;
    expect(layer.props).toEqual({
      alt: 'Alt',
      assetRef: 'asset://image.png',
      crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
    });
    expect(nodeTransform(layer)).toMatchObject({
      height: 100,
      width: 150,
    });
  });

  it('deletes data keys when patch value is undefined', () => {
    const scene = testDocument([
      testArtboard({
        id: 'p1',
        nodes: [
          legacyLayer({
            data: {
              alt: 'Alt',
              assetRef: 'asset://image.png',
              crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
            },
            id: 'image-1',
            transform: createDefaultFrame(),
            type: 'canvas.image',
          }),
        ],
      }),
    ]);
    const store = new SceneStore(scene, {
      activeArtboardId: 'p1',
      primaryNodeId: 'image-1',
      selectedNodeIds: ['image-1'],
    });
    const command = new UpdateLayerTransformCommand();

    command.execute(createContext(store), {
      dataPatch: {
        crop: undefined,
      },
      layerId: 'image-1',
      transform: createDefaultFrame(),
    });

    const layer = store.getScene().artboards[0]!.nodes[0]!;
    expect(layer.props).toEqual({
      alt: 'Alt',
      assetRef: 'asset://image.png',
    });
  });
});

describe('UpdateLayerTransformCommand group child isolation', () => {
  it('updates only the moved child - siblings and group origin stay put', () => {
    const siblingTransform = {
      ...createDefaultFrame(),
      height: 40,
      width: 40,
      x: 100,
      y: 10,
    };
    const groupTransform = {
      ...createDefaultFrame(),
      height: 200,
      width: 300,
      x: 50,
      y: 50,
    };
    const scene = testDocument([
      testArtboard({
        id: 'p1',
        nodes: [
          legacyLayer({
            children: [
              legacyLayer({
                data: { fill: '#000' },
                id: 'child-a',
                transform: {
                  ...createDefaultFrame(),
                  height: 40,
                  width: 40,
                  x: 0,
                  y: 0,
                },
                type: 'canvas.rect',
              }),
              legacyLayer({
                data: { fill: '#111' },
                id: 'child-b',
                transform: siblingTransform,
                type: 'canvas.rect',
              }),
            ],
            id: 'group-1',
            transform: groupTransform,
            type: 'canvas.group',
          }),
        ],
      }),
    ]);
    const store = new SceneStore(scene, {
      activeArtboardId: 'p1',
      primaryNodeId: 'child-a',
      selectedNodeIds: ['child-a'],
    });
    const command = new UpdateLayerTransformCommand();

    command.execute(createContext(store), {
      layerId: 'child-a',
      transform: {
        ...createDefaultFrame(),
        height: 40,
        width: 40,
        x: -30,
        y: -20,
      },
    });

    const group = store.getScene().artboards[0]!.nodes[0]!;
    const children = getLayerChildren(group);
    expect(nodeTransform(group)).toMatchObject(groupTransform);
    expect(nodeTransform(children[0]!)).toMatchObject({ x: -30, y: -20 });
    expect(nodeTransform(children[1]!)).toMatchObject(siblingTransform);
  });
});

describe('SetLayerRotationCommand', () => {
  it('rotates around center and updates position', () => {
    const scene = testDocument([
      testArtboard({
        id: 'p1',
        nodes: [
          legacyLayer({
            data: { fill: '#000' },
            id: 'rect-1',
            transform: {
              ...createDefaultFrame(),
              height: 100,
              width: 200,
              x: 100,
              y: 100,
            },
            type: 'canvas.rect',
          }),
        ],
      }),
    ]);
    const store = new SceneStore(scene, {
      activeArtboardId: 'p1',
      primaryNodeId: 'rect-1',
      selectedNodeIds: ['rect-1'],
    });
    new SetLayerRotationCommand().execute(createContext(store), {
      layerId: 'rect-1',
      rotation: 90,
    });

    const transform = nodeTransform(store.getScene().artboards[0]!.nodes[0]!);
    expect(transform.rotation).toBe(90);
    expect(transform.x).toBeCloseTo(250);
    expect(transform.y).toBeCloseTo(50);
  });
});

describe('RotateLayerRightCommand', () => {
  it('rotates around center and updates position', () => {
    const scene = testDocument([
      testArtboard({
        id: 'p1',
        nodes: [
          legacyLayer({
            data: { fill: '#000' },
            id: 'rect-1',
            transform: {
              ...createDefaultFrame(),
              height: 100,
              width: 200,
              x: 100,
              y: 100,
            },
            type: 'canvas.rect',
          }),
        ],
      }),
    ]);
    const store = new SceneStore(scene, {
      activeArtboardId: 'p1',
      primaryNodeId: 'rect-1',
      selectedNodeIds: ['rect-1'],
    });
    new RotateLayerRightCommand().execute(createContext(store));

    const transform = nodeTransform(store.getScene().artboards[0]!.nodes[0]!);
    expect(transform.rotation).toBe(90);
    expect(transform.x).toBeCloseTo(250);
    expect(transform.y).toBeCloseTo(50);
  });
});
