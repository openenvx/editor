import { describe, expect, it } from 'vitest';

import { createHtmlCommandHarness, htmlDemoSelection } from '../test/html-editor-harness';
import { findBlock, getBlockChildren } from '../tree/block-tree';

describe('html block commands', () => {
  it('insert → move → update → undo restores prior scene', async () => {
    const { manager, runtime, store } = createHtmlCommandHarness();
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
        newParentId: 'flex-1',
        index: 0,
      });
    expect(findBlock(store.getScene().pages[0]!.layers, newId)?.parentId).toBe(
      'flex-1'
    );

    await manager
      .getRegistries()
      .commands.execute('html.updateBlockData', ctx, runtime.getEvents(), {
        id: newId,
        patch: { html: 'Updated' },
      });
    expect(
      (
        findBlock(store.getScene().pages[0]!.layers, newId)!.block.data as {
          html: string;
        }
      ).html
    ).toBe('Updated');

    expect(store.undo()).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.getScene()).toEqual(before);

    runtime.dispose();
  });

  it('refuses to remove html.root', async () => {
    const { manager, runtime, store } = createHtmlCommandHarness();
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
    const { manager, runtime, store } = createHtmlCommandHarness();
    store.setSelection({
      ...htmlDemoSelection,
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
    const { manager, runtime, store } = createHtmlCommandHarness();
    store.setSelection({
      ...htmlDemoSelection,
      primaryLayerId: 'heading-1',
      selectedLayerIds: ['heading-1'],
    });
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('html.duplicateBlock', ctx, runtime.getEvents());

    const root = store.getScene().pages[0]!.layers[0]!;
    const children = getBlockChildren(root);
    expect(children.length).toBe(5);
    expect(children[1]!.type).toBe('html.heading');
    expect(children[1]!.id).not.toBe('heading-1');
    expect(store.getSelection().selectedLayerIds).toEqual([children[1]!.id]);
    runtime.dispose();
  });

  it('moves block siblings up and down', async () => {
    const { manager, runtime, store } = createHtmlCommandHarness();
    store.setSelection({
      ...htmlDemoSelection,
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
    const { manager, runtime, store } = createHtmlCommandHarness();
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

  it('guards insert/move/update when args or registry are invalid', async () => {
    const { manager, runtime, store } = createHtmlCommandHarness();
    const ctx = runtime.createCommandContext();
    const before = structuredClone(store.getScene());
    const commands = manager.getRegistries().commands;

    await commands.execute('html.insertBlock', ctx, runtime.getEvents(), {});
    await commands.execute('html.insertBlock', ctx, runtime.getEvents(), {
      type: 'html.root',
      parentId: 'root',
    });
    await commands.execute('html.insertBlock', ctx, runtime.getEvents(), {
      type: 'html.missing',
      parentId: 'root',
    });
    await commands.execute('html.moveBlock', ctx, runtime.getEvents(), {});
    await commands.execute('html.moveBlock', ctx, runtime.getEvents(), {
      id: 'root',
      newParentId: null,
    });
    await commands.execute('html.moveBlock', ctx, runtime.getEvents(), {
      id: 'missing',
      newParentId: 'root',
    });
    await commands.execute('html.updateBlockData', ctx, runtime.getEvents(), {
      id: 'text-1',
    });
    await commands.execute('html.duplicateBlock', ctx, runtime.getEvents(), {});
    await commands.execute('html.moveBlockUp', ctx, runtime.getEvents(), {});
    await commands.execute('html.moveBlockDown', ctx, runtime.getEvents(), {
      id: 'root',
    });
    expect(store.getScene()).toEqual(before);

    expect(commands.get('html.moveBlockUp')!.canExecute(ctx)).toBe(false);
    store.setSelection({
      ...htmlDemoSelection,
      primaryLayerId: 'heading-1',
      selectedLayerIds: ['heading-1'],
    });
    expect(
      commands
        .get('html.moveBlockUp')!
        .canExecute(runtime.createCommandContext())
    ).toBe(false);
    expect(
      commands
        .get('html.moveBlockDown')!
        .canExecute(runtime.createCommandContext())
    ).toBe(true);
    expect(
      commands
        .get('html.duplicateBlock')!
        .canExecute(runtime.createCommandContext())
    ).toBe(true);
    expect(
      commands
        .get('html.removeBlock')!
        .canExecute(runtime.createCommandContext(), { id: 'root' })
    ).toBe(false);
    expect(
      commands.get('html.removeBlock')!.canExecute(runtime.createCommandContext())
    ).toBe(true);

    await commands.execute(
      'html.removeBlock',
      runtime.createCommandContext(),
      runtime.getEvents(),
      { id: 'missing-block' }
    );
    store.setSelection(htmlDemoSelection);
    await commands.execute(
      'html.removeBlock',
      runtime.createCommandContext(),
      runtime.getEvents()
    );
    await commands.execute(
      'html.duplicateBlock',
      runtime.createCommandContext(),
      runtime.getEvents(),
      { id: 'root' }
    );

    store.setSelection({
      ...htmlDemoSelection,
      primaryLayerId: 'grid-1',
      selectedLayerIds: ['grid-1'],
    });
    expect(
      commands
        .get('html.moveBlockDown')!
        .canExecute(runtime.createCommandContext())
    ).toBe(false);

    runtime.dispose();
  });

  it('inserts and reorders pure children inside flex and grid', async () => {
    const { manager, runtime, store } = createHtmlCommandHarness();
    const ctx = runtime.createCommandContext();

    await manager
      .getRegistries()
      .commands.execute('html.insertBlock', ctx, runtime.getEvents(), {
        type: 'html.text',
        parentId: 'grid-1',
        index: Number.POSITIVE_INFINITY,
      });

    let grid = findBlock(store.getScene().pages[0]!.layers, 'grid-1')!.block;
    let children = getBlockChildren(grid);
    expect(children).toHaveLength(3);
    expect(children.every((child) => child.type !== 'html.slot')).toBe(true);
    const insertedId = children.at(-1)!.id;

    await manager
      .getRegistries()
      .commands.execute('html.moveBlock', ctx, runtime.getEvents(), {
        id: insertedId,
        newParentId: 'flex-1',
        index: 0,
      });

    expect(
      findBlock(store.getScene().pages[0]!.layers, insertedId)?.parentId
    ).toBe('flex-1');
    grid = findBlock(store.getScene().pages[0]!.layers, 'grid-1')!.block;
    expect(getBlockChildren(grid)).toHaveLength(2);

    children = getBlockChildren(
      findBlock(store.getScene().pages[0]!.layers, 'flex-1')!.block
    );
    expect(children[0]!.id).toBe(insertedId);
    runtime.dispose();
  });
});
