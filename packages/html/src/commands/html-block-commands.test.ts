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
  InsertHtmlBlockCommand,
  MoveHtmlBlockCommand,
  RemoveHtmlBlockCommand,
  UpdateHtmlBlockDataCommand,
} from '../commands/html-block-commands';
import { createHtmlDemoScene } from '../create-html-demo-scene';
import { findBlock } from '../tree/block-tree';

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
        patch: { text: 'Updated' },
      });
    expect(
      (findBlock(store.getScene().pages[0]!.layers, newId)!.block.data as {
        text: string;
      }).text
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
