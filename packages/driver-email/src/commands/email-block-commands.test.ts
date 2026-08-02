import {
  EditorRuntime,
  EditorService,
  PluginManager,
  SceneStore,
  SimpleServiceContribution,
} from '@openenvx/core';
import { BlockRegistry, createBlockCommands, findBlock } from '@openenvx/html';
import { describe, expect, it } from 'vitest';

import { EmailBlockRegistryServiceId } from '../block-registry';
import { builtinEmailBlocks } from '../blocks/builtin-blocks';
import { createEmailDemoScene } from '../create-email-demo-scene';

function createEmailCommandHarness() {
  const registry = new BlockRegistry();
  for (const block of builtinEmailBlocks) {
    registry.register(block);
  }
  const store = new SceneStore(createEmailDemoScene());
  const runtime = new EditorRuntime(store, new EditorService());
  const manager = new PluginManager(runtime);
  manager
    .createPluginContext()
    .register(
      new SimpleServiceContribution(EmailBlockRegistryServiceId, () => registry),
      ...createBlockCommands({
        prefix: 'email',
        rootType: 'email.root',
        registryServiceId: EmailBlockRegistryServiceId,
        typePrefix: 'email.',
        pageLayout: 'email',
      })
    );
  return { manager, runtime, store };
}

describe('email block commands', () => {
  it('refuses to remove a non-email layer type', async () => {
    const { manager, runtime, store } = createEmailCommandHarness();
    const scene = store.getScene();
    const page = scene.pages[0]!;
    page.layers.push({
      id: 'html-intruder',
      type: 'html.text',
      data: { html: 'nope' },
    } as (typeof page.layers)[number]);
    store.setScene(scene);
    store.setSelection({
      activePageId: page.id,
      primaryLayerId: 'html-intruder',
      selectedLayerIds: ['html-intruder'],
    });
    const before = structuredClone(store.getScene());
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('email.removeBlock', ctx, runtime.getEvents(), {
        id: 'html-intruder',
      });

    expect(store.getScene()).toEqual(before);
    runtime.dispose();
  });

  it('can remove an email text block', async () => {
    const { manager, runtime, store } = createEmailCommandHarness();
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('email.removeBlock', ctx, runtime.getEvents(), {
        id: 'text-1',
      });

    expect(
      findBlock(store.getScene().pages[0]!.layers, 'text-1')
    ).toBeNull();
    runtime.dispose();
  });
});
