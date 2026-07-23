import {
  EditorRuntime,
  EditorService,
  PluginManager,
  SceneStore,
  SimpleServiceContribution,
} from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import { builtinBlocks } from '../blocks/builtin-blocks';
import {
  BlockRegistry,
  BlockRegistryServiceId,
} from '../block-registry';
import {
  DuplicateHtmlBlockCommand,
  InsertHtmlBlockCommand,
  MoveHtmlBlockCommand,
  MoveHtmlBlockDownCommand,
  MoveHtmlBlockUpCommand,
  RemoveHtmlBlockCommand,
  UpdateHtmlBlockDataCommand,
} from '../commands/html-block-commands';
import { createHtmlDemoScene } from '../create-html-demo-scene';
import { findBlock, getBlockChildren } from '../tree/block-tree';

function createHarness() {
  const registry = new BlockRegistry();
  for (const block of builtinBlocks) {
    registry.register(block);
  }

  const store = new SceneStore(createHtmlDemoScene());
  const runtime = new EditorRuntime(store, new EditorService());
  const manager = new PluginManager(runtime);
  manager.createPluginContext().register(
    new SimpleServiceContribution(BlockRegistryServiceId, () => registry),
    new InsertHtmlBlockCommand(),
    new MoveHtmlBlockCommand(),
    new MoveHtmlBlockUpCommand(),
    new MoveHtmlBlockDownCommand(),
    new DuplicateHtmlBlockCommand(),
    new UpdateHtmlBlockDataCommand(),
    new RemoveHtmlBlockCommand()
  );
  return { manager, registry, runtime, store };
}

describe('html block commands', () => {
  it('insert → move → update → undo restores prior scene', async () => {
    const { manager, runtime, store } = createHarness();
    const before = structuredClone(store.getScene());
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('html.insertBlock', ctx, runtime.getEvents(), {
        type: 'html.text',
        parentId: 'root',
        index: 0,
      });

    const afterInsert = store.getScene();
    const inserted = afterInsert.pages[0]!.layers[0]!;
    const children = (inserted.data as { children: { id: string }[] }).children;
    const newId = children[0]!.id;
    expect(findBlock(afterInsert.pages[0]!.layers, newId)).not.toBeNull();

    await manager
      .getRegistries()
      .commands.execute('html.moveBlock', ctx, runtime.getEvents(), {
        id: newId,
        newParentId: 'container-1',
        index: 0,
      });
    expect(findBlock(store.getScene().pages[0]!.layers, newId)?.parentId).toBe(
      'container-1'
    );

    await manager
      .getRegistries()
      .commands.execute('html.updateBlockData', ctx, runtime.getEvents(), {
        id: newId,
        patch: { html: 'Updated' },
      });
    expect(
      (findBlock(store.getScene().pages[0]!.layers, newId)!.block.data as {
        html: string;
      }).html
    ).toBe('Updated');

    expect(store.undo()).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.getScene()).toEqual(before);

    runtime.dispose();
  });

  it('refuses to remove html.root', async () => {
    const { manager, runtime, store } = createHarness();
    const ctx = runtime.createCommandContext();
    const before = structuredClone(store.getScene());

    await manager
      .getRegistries()
      .commands.execute('html.removeBlock', ctx, runtime.getEvents(), {
        id: 'root',
      });

    expect(store.getScene()).toEqual(before);
    runtime.dispose();
  });

  it('removes selected block when args.id is omitted', async () => {
    const { manager, runtime, store } = createHarness();
    store.setSelection({
      activePageId: 'html-page',
      primaryLayerId: 'text-1',
      selectedLayerIds: ['text-1'],
    });
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('html.removeBlock', ctx, runtime.getEvents());

    expect(findBlock(store.getScene().pages[0]!.layers, 'text-1')).toBeNull();
    runtime.dispose();
  });

  it('duplicates selected block under the same parent', async () => {
    const { manager, runtime, store } = createHarness();
    store.setSelection({
      activePageId: 'html-page',
      primaryLayerId: 'heading-1',
      selectedLayerIds: ['heading-1'],
    });
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('html.duplicateBlock', ctx, runtime.getEvents());

    const root = store.getScene().pages[0]!.layers[0]!;
    const children = getBlockChildren(root);
    expect(children.length).toBe(4);
    expect(children[1]!.type).toBe('html.heading');
    expect(children[1]!.id).not.toBe('heading-1');
    expect(store.getSelection().selectedLayerIds).toEqual([children[1]!.id]);
    runtime.dispose();
  });

  it('moves block siblings up and down', async () => {
    const { manager, runtime, store } = createHarness();
    store.setSelection({
      activePageId: 'html-page',
      primaryLayerId: 'text-1',
      selectedLayerIds: ['text-1'],
    });
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('html.moveBlockUp', ctx, runtime.getEvents());

    let children = getBlockChildren(store.getScene().pages[0]!.layers[0]!);
    expect(children[0]!.id).toBe('text-1');

    await manager
      .getRegistries()
      .commands.execute('html.moveBlockDown', ctx, runtime.getEvents());

    children = getBlockChildren(store.getScene().pages[0]!.layers[0]!);
    expect(children[1]!.id).toBe('text-1');
    runtime.dispose();
  });

  it('refuses to nest under a non-accepting parent', async () => {
    const { manager, runtime, store } = createHarness();
    const ctx = runtime.createCommandContext();
    const before = structuredClone(store.getScene());

    await manager
      .getRegistries()
      .commands.execute('html.insertBlock', ctx, runtime.getEvents(), {
        type: 'html.text',
        parentId: 'heading-1',
        index: 0,
      });

    expect(store.getScene()).toEqual(before);
    runtime.dispose();
  });
});
