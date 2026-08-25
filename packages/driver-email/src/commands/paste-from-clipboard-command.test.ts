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
import { createEmailPasteCommand } from './paste-from-clipboard-command';

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
      createEmailPasteCommand(),
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

describe('email.pasteFromClipboard', () => {
  it('inserts mapped blocks after the selected text block', async () => {
    const { manager, runtime, store } = createEmailCommandHarness();
    store.setSelection({
      activePageId: store.getScene().pages[0]!.id,
      primaryLayerId: 'text-1',
      selectedLayerIds: ['text-1'],
    });
    const ctx = runtime.createCommandContext();
    const beforeCount = findBlock(
      store.getScene().pages[0]!.layers,
      'section-1'
    )!.block.data.children?.length;

    await manager.getRegistries().commands.execute(
      'email.pasteFromClipboard',
      ctx,
      runtime.getEvents(),
      {
        html: '<h2>Pasted title</h2><p>Pasted body</p>',
      }
    );

    const section = findBlock(store.getScene().pages[0]!.layers, 'section-1')!
      .block;
    const children = (section.data as { children: { id: string; type: string }[] })
      .children;
    expect(children.length).toBe((beforeCount as number) + 2);
    expect(children[2]?.type).toBe('email.heading');
    expect(children[3]?.type).toBe('email.text');
    expect(store.getSelection().selectedLayerIds[0]).toBe(children[2]?.id);
    runtime.dispose();
  });

  it('wraps root paste in a new section', async () => {
    const { manager, runtime, store } = createEmailCommandHarness();
    store.setSelection({
      activePageId: store.getScene().pages[0]!.id,
      primaryLayerId: null,
      selectedLayerIds: [],
    });
    const ctx = runtime.createCommandContext();

    await manager.getRegistries().commands.execute(
      'email.pasteFromClipboard',
      ctx,
      runtime.getEvents(),
      { plain: 'Hello there' }
    );

    const root = findBlock(store.getScene().pages[0]!.layers, 'email-root')!
      .block;
    const children = (root.data as { children: { type: string }[] }).children;
    expect(children).toHaveLength(2);
    expect(children[1]?.type).toBe('email.section');
    runtime.dispose();
  });
});
