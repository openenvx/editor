import {
  EditorService,
  getLayerChildren,
  InstantiationService,
  SceneStore,
  WorkbenchEventService,
  type CommandContext,
} from '@openenvx/studio/core';
import { createDefaultFrame } from '@openenvx/studio/schema';
import type { EditorSession } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  GroupSelectionCommand,
  InsertCanvasGroupCommand,
  UngroupSelectionCommand,
} from './canvas-group-commands';
import { groupRootLayers } from '../scene/group-layers';
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

const baseNodes = [
  legacyLayer({
    data: { fill: '#000' },
    id: 'rect-1',
    transform: { ...createDefaultFrame(), height: 100, width: 100 },
    type: 'canvas.rect',
  }),
  legacyLayer({
    data: { fill: '#fff' },
    id: 'rect-2',
    transform: {
      ...createDefaultFrame(),
      height: 100,
      width: 100,
      x: 120,
    },
    type: 'canvas.rect',
  }),
];

const baseArtboard = testArtboard({
  id: 'page-1',
  nodes: baseNodes,
});

const baseScene = testDocument([baseArtboard]);

const selectedSession: EditorSession = {
  activeArtboardId: 'page-1',
  primaryNodeId: 'rect-1',
  selectedNodeIds: ['rect-1', 'rect-2'],
};

describe('canvas group commands', () => {
  it('insertGroup appends a canvas.group layer', () => {
    const store = new SceneStore(baseScene, {
      activeArtboardId: 'page-1',
      primaryNodeId: null,
      selectedNodeIds: [],
    });
    const ctx = createContext(store);
    const command = new InsertCanvasGroupCommand();
    expect(command.canExecute(ctx)).toBe(true);
    command.execute(ctx);
    const page = ctx.scene.getDocument().artboards[0];
    const group = page?.nodes.find((layer) => layer.type === 'canvas.group');
    expect(group).toBeDefined();
    expect(ctx.scene.getSelection().primaryNodeId).toBe(group?.id);
  });

  it('groupSelection wraps selected root layers', () => {
    const store = new SceneStore(baseScene, selectedSession);
    const ctx = createContext(store);
    const command = new GroupSelectionCommand();
    expect(command.canExecute(ctx)).toBe(true);
    command.execute(ctx);
    const page = ctx.scene.getDocument().artboards[0];
    expect(page?.nodes).toHaveLength(1);
    const groupLayer = page?.nodes[0];
    expect(groupLayer?.type).toBe('canvas.group');
    const children = getLayerChildren(groupLayer!);
    expect(children.map((child) => child.id)).toStrictEqual([
      'rect-1',
      'rect-2',
    ]);
  });

  it('ungroup restores children to root', () => {
    const groupedLayers = groupRootLayers(
      baseScene.artboards[0]!.nodes,
      ['rect-1', 'rect-2'],
      'group-1',
      baseScene.artboards[0]!
    );
    const store = new SceneStore(
      testDocument([{ ...baseArtboard, nodes: groupedLayers }]),
      {
        activeArtboardId: 'page-1',
        primaryNodeId: 'group-1',
        selectedNodeIds: ['group-1'],
      }
    );
    const ctx = createContext(store);
    const command = new UngroupSelectionCommand();
    expect(command.canExecute(ctx)).toBe(true);
    command.execute(ctx);
    const page = ctx.scene.getDocument().artboards[0];
    expect(page?.nodes).toHaveLength(2);
    expect(page?.nodes.map((layer) => layer.id)).toStrictEqual([
      'rect-1',
      'rect-2',
    ]);
  });
});
