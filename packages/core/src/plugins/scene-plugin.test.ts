import type { LayerWriteMode } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { EditorService } from '../workbench/editor-service';
import { SceneStore } from '../scene/scene-store';
import { WorkbenchEventService } from '../runtime/workbench-events';
import { InstantiationService } from '../runtime/instantiation-service';
import type { CommandContext } from '../runtime/types';
import type { Layer } from '../scene/types';
import {
  DeleteLayerCommand,
  MoveDownCommand,
  MoveLayerCommand,
  MoveUpCommand,
  ToggleLayerLockCommand,
} from './scene-plugin';

function createScene(layers: Layer[]) {
  return {
    activePageId: 'page-1',
    pages: [{ id: 'page-1', name: 'Page', layout: 'flow' as const, layers }],
    schemaVersion: 1,
    selection: {
      activePageId: 'page-1',
      selectedLayerIds: [],
      primaryLayerId: null,
    },
  };
}

function createContext(
  layers: Layer[],
  selectedIds: string[],
  primaryId: string | null = null
): CommandContext {
  const scene = createScene(layers);
  const store = new SceneStore(scene);
  store.selectLayers(selectedIds, primaryId);
  const services = new InstantiationService();
  const editor = new EditorService();
  editor.open(
    {
      uri: 'untitled',
      title: 'Untitled',
      scene: store.getScene(),
      isDirty: false,
    },
    0
  );
  const ctx: CommandContext = {
    scene: store,
    selection: store.getScene().selection,
    services,
    events: new WorkbenchEventService(),
    editor,
  };
  return ctx;
}

function createLayer(
  id: string,
  writeMode: LayerWriteMode = 'free',
  locked = false
): Layer {
  return {
    id,
    type: 'canvas.text',
    data: { html: '<p>x</p>' },
    writeMode,
    locked,
  };
}

describe('ScenePlugin delete command', () => {
  const deleteCommand = new DeleteLayerCommand();

  it('can execute when all selected layers are writable', () => {
    const ctx = createContext([createLayer('a'), createLayer('b')], ['a']);
    expect(deleteCommand.canExecute(ctx)).toBe(true);
  });

  it('cannot execute when any selected layer is config-locked', () => {
    const ctx = createContext(
      [createLayer('a'), createLayer('b', 'locked')],
      ['a', 'b']
    );
    expect(deleteCommand.canExecute(ctx)).toBe(false);
  });

  it('cannot execute when any selected layer is runtime-locked', () => {
    const ctx = createContext(
      [createLayer('a'), createLayer('b', 'free', true)],
      ['a', 'b']
    );
    expect(deleteCommand.canExecute(ctx)).toBe(false);
  });

  it('cannot execute with no selection', () => {
    const ctx = createContext([createLayer('a')], []);
    expect(deleteCommand.canExecute(ctx)).toBe(false);
  });
});

describe('ScenePlugin move up/down commands', () => {
  const moveUp = new MoveUpCommand();
  const moveDown = new MoveDownCommand();

  it('move up disabled when primary layer is config-locked', () => {
    const ctx = createContext(
      [createLayer('a'), createLayer('b', 'locked')],
      ['b'],
      'b'
    );
    expect(moveUp.canExecute(ctx)).toBe(false);
  });

  it('move up disabled when primary layer is runtime-locked', () => {
    const ctx = createContext(
      [createLayer('a'), createLayer('b', 'free', true)],
      ['b'],
      'b'
    );
    expect(moveUp.canExecute(ctx)).toBe(false);
  });

  it('move down disabled when primary layer is not writable', () => {
    const ctx = createContext(
      [createLayer('a', 'free', true), createLayer('b')],
      ['a'],
      'a'
    );
    expect(moveDown.canExecute(ctx)).toBe(false);
  });

  it('move up enabled for writable layer at index > 0', () => {
    const ctx = createContext(
      [createLayer('a'), createLayer('b')],
      ['b'],
      'b'
    );
    expect(moveUp.canExecute(ctx)).toBe(true);
  });

  it('move down enabled for writable layer at index < length - 1', () => {
    const ctx = createContext(
      [createLayer('a'), createLayer('b')],
      ['a'],
      'a'
    );
    expect(moveDown.canExecute(ctx)).toBe(true);
  });
});

describe('ScenePlugin move layer command', () => {
  const moveLayer = new MoveLayerCommand();

  it('cannot execute when target layer is config-locked', () => {
    const ctx = createContext(
      [createLayer('a', 'locked'), createLayer('b')],
      ['a'],
      'a'
    );
    expect(moveLayer.canExecute(ctx, { layerId: 'a', targetIndex: 1 })).toBe(
      false
    );
  });

  it('cannot execute when target layer is runtime-locked', () => {
    const ctx = createContext(
      [createLayer('a', 'free', true), createLayer('b')],
      ['a'],
      'a'
    );
    expect(moveLayer.canExecute(ctx, { layerId: 'a', targetIndex: 1 })).toBe(
      false
    );
  });

  it('can execute when target layer is writable', () => {
    const ctx = createContext(
      [createLayer('a'), createLayer('b')],
      ['a'],
      'a'
    );
    expect(moveLayer.canExecute(ctx, { layerId: 'a', targetIndex: 1 })).toBe(
      true
    );
  });
});

describe('ScenePlugin toggle layer lock command', () => {
  const toggleLock = new ToggleLayerLockCommand();

  it('cannot execute when no layer is selected', () => {
    const ctx = createContext([createLayer('a')], []);
    expect(toggleLock.canExecute(ctx)).toBe(false);
  });

  it('cannot execute when selected layer is config-locked', () => {
    const ctx = createContext([createLayer('a', 'locked')], ['a'], 'a');
    expect(toggleLock.canExecute(ctx)).toBe(false);
  });

  it('can execute when selected layer is editable', () => {
    const ctx = createContext([createLayer('a')], ['a'], 'a');
    expect(toggleLock.canExecute(ctx)).toBe(true);
  });

  it('can execute when selected layer is already runtime-locked', () => {
    const ctx = createContext([createLayer('a', 'free', true)], ['a'], 'a');
    expect(toggleLock.canExecute(ctx)).toBe(true);
  });

  it('toggles locked flag on the selected layer', () => {
    const ctx = createContext([createLayer('a')], ['a'], 'a');
    expect(ctx.scene.getScene().pages[0]!.layers[0]!.locked).toBe(false);
    toggleLock.execute(ctx);
    expect(ctx.scene.getScene().pages[0]!.layers[0]!.locked).toBe(true);
    toggleLock.execute(ctx);
    expect(ctx.scene.getScene().pages[0]!.layers[0]!.locked).toBe(false);
  });
});
