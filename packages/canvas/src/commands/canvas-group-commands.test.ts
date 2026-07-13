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
  GroupSelectionCommand,
  InsertCanvasGroupCommand,
  UngroupSelectionCommand,
} from './canvas-group-commands';
import { groupRootLayers } from '../scene/group-layers';

function createContext(sceneStore: SceneStore): CommandContext {
  const scene = sceneStore.getScene();
  return {
    editor: new EditorService(),
    events: new WorkbenchEventService(),
    scene: sceneStore,
    selection: scene.selection,
    services: new InstantiationService(),
  };
}

describe('canvas group commands', () => {
  const baseScene = normalizeScene({
    activePageId: 'page-1',
    pages: [
      {
        id: 'page-1',
        layout: 'absolute',
        layers: [
          {
            data: { fill: '#000' },
            id: 'rect-1',
            transform: { ...createDefaultTransform(), width: 100, height: 100 },
            type: 'canvas.rect',
          },
          {
            data: { fill: '#fff' },
            id: 'rect-2',
            transform: {
              ...createDefaultTransform(),
              x: 120,
              width: 100,
              height: 100,
            },
            type: 'canvas.rect',
          },
        ],
        name: 'Page',
        width: 800,
        height: 600,
      },
    ],
    selection: {
      activePageId: 'page-1',
      primaryLayerId: 'rect-1',
      selectedLayerIds: ['rect-1', 'rect-2'],
    },
  });

  it('insertGroup appends a canvas.group layer', () => {
    const store = new SceneStore(
      normalizeScene({
        ...baseScene,
        selection: {
          activePageId: 'page-1',
          primaryLayerId: null,
          selectedLayerIds: [],
        },
      })
    );
    const ctx = createContext(store);
    const command = new InsertCanvasGroupCommand();
    expect(command.canExecute(ctx)).toBe(true);
    command.execute(ctx);
    const page = ctx.scene.getScene().pages[0];
    const group = page?.layers.find((layer) => layer.type === 'canvas.group');
    expect(group).toBeDefined();
    expect(ctx.scene.getSelection().primaryLayerId).toBe(group?.id);
  });

  it('groupSelection wraps selected root layers', () => {
    const store = new SceneStore(baseScene);
    const ctx = createContext(store);
    const command = new GroupSelectionCommand();
    expect(command.canExecute(ctx)).toBe(true);
    command.execute(ctx);
    const page = ctx.scene.getScene().pages[0];
    expect(page?.layers).toHaveLength(1);
    const groupLayer = page?.layers[0];
    expect(groupLayer?.type).toBe('canvas.group');
    const children = (groupLayer?.data as { children: { id: string }[] } | undefined)
      ?.children ?? [];
    expect(children.map((child) => child.id)).toStrictEqual([
      'rect-1',
      'rect-2',
    ]);
  });

  it('ungroup restores children to root', () => {
    const groupedLayers = groupRootLayers(
      baseScene.pages[0]!.layers,
      ['rect-1', 'rect-2'],
      'group-1',
      baseScene.pages[0]!
    );
    const store = new SceneStore(
      normalizeScene({
        ...baseScene,
        pages: [{ ...baseScene.pages[0]!, layers: groupedLayers }],
        selection: {
          activePageId: 'page-1',
          primaryLayerId: 'group-1',
          selectedLayerIds: ['group-1'],
        },
      })
    );
    const ctx = createContext(store);
    const command = new UngroupSelectionCommand();
    expect(command.canExecute(ctx)).toBe(true);
    command.execute(ctx);
    const page = ctx.scene.getScene().pages[0];
    expect(page?.layers).toHaveLength(2);
    expect(page?.layers.map((layer) => layer.id)).toStrictEqual([
      'rect-1',
      'rect-2',
    ]);
  });
});
