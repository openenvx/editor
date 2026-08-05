import { describe, expect, it } from 'vitest';

import type { Layer } from '@xmazu/openenvxee-schema';

import {
  cloneBlockWithNewIds,
  createBlock,
  findBlock,
  getPageRootId,
  insertAt,
  mapPageLayers,
  moveTo,
  removeById,
  siblingCount,
  updateBlockData,
} from './block-tree';

function block(id: string, type: string, children: Layer[] = []): Layer {
  return {
    id,
    type,
    data: { children },
  };
}

describe('block-tree', () => {
  it('finds nested blocks and reports parent', () => {
    const layers = [
      block('root', 'html.root', [
        block('a', 'html.heading'),
        block('c', 'html.flex', [block('b', 'html.text')]),
      ]),
    ];
    expect(findBlock(layers, 'b')).toEqual({
      block: expect.objectContaining({ id: 'b' }),
      index: 0,
      parentId: 'c',
    });
  });

  it('inserts, moves, updates, and removes', () => {
    let layers = [block('root', 'html.root', [])];
    const heading = createBlock('html.heading', 'h1', { html: 'Hi' });
    layers = insertAt(layers, 'root', heading, 0);
    expect(findBlock(layers, 'h1')?.parentId).toBe('root');

    const flex = createBlock('html.flex', 'box', { children: [] });
    layers = insertAt(layers, 'root', flex, 1);
    layers = moveTo(layers, 'h1', 'box', 0);
    expect(findBlock(layers, 'h1')?.parentId).toBe('box');

    layers = updateBlockData(layers, 'h1', { html: 'Hello' });
    expect((findBlock(layers, 'h1')!.block.data as { html: string }).html).toBe(
      'Hello'
    );

    layers = removeById(layers, 'h1');
    expect(findBlock(layers, 'h1')).toBeNull();
  });

  it('refuses to move a block into itself', () => {
    const layers = [
      block('root', 'html.root', [block('box', 'html.flex', [])]),
    ];
    expect(moveTo(layers, 'box', 'box', 0)).toBe(layers);
  });

  it('clones nested trees, reports root and sibling counts', () => {
    const nested = block('root', 'html.root', [
      block('box', 'html.flex', [block('a', 'html.text')]),
    ]);
    const clone = cloneBlockWithNewIds(nested, (type) => `${type}-new`);
    expect(clone.id).toBe('html.root-new');
    expect(clone.id).not.toBe('root');
    const children = (clone.data as { children: Layer[] }).children;
    expect(children[0]!.id).toBe('html.flex-new');
    expect((children[0]!.data as { children: Layer[] }).children[0]!.id).toBe(
      'html.text-new'
    );

    const fromDefaults = createBlock('html.flex', 'box-1', {
      children: [{ id: 'fixed-child', type: 'html.text', data: { html: 'x' } }],
    });
    const minted = (fromDefaults.data as { children: Layer[] }).children[0]!;
    expect(fromDefaults.id).toBe('box-1');
    expect(minted.id).not.toBe('fixed-child');
    expect(minted.type).toBe('html.text');

    const bare = cloneBlockWithNewIds(
      { id: 'x', type: 'html.text', data: null },
      () => 'fresh'
    );
    expect(bare.id).toBe('fresh');
    expect(bare.data).toEqual({});

    expect(
      getPageRootId({
        id: 'p',
        name: 'P',
        layout: 'html',
        layers: [block('root', 'html.root')],
      })
    ).toBe('root');
    expect(
      getPageRootId({
        id: 'p',
        name: 'P',
        layout: 'html',
        layers: [block('event', 'snapvelo.root')],
      })
    ).toBe('event');
    expect(
      getPageRootId({ id: 'p', name: 'P', layout: 'html', layers: [] })
    ).toBeNull();

    const layers = [block('root', 'html.root', [block('a', 'html.text')])];
    expect(siblingCount(layers, null)).toBe(1);
    expect(siblingCount(layers, 'root')).toBe(1);
    expect(siblingCount(layers, 'missing')).toBe(0);

    expect(insertAt(layers, null, createBlock('html.text', 'top', {}), 0)[0]!
      .id).toBe('top');
    expect(moveTo(layers, 'missing', 'root', 0)).toBe(layers);
    expect(moveTo(layers, 'a', 'a', 0)).toBe(layers);

    const updated = updateBlockData(
      [{ id: 'n', type: 'html.text', data: null }],
      'n',
      { html: 'x' }
    );
    expect(updated[0]!.data).toEqual({ html: 'x' });

    const scene = {
      schemaVersion: 1,
      pages: [
        { id: 'p1', name: 'A', layout: 'html' as const, layers },
        { id: 'p2', name: 'B', layout: 'html' as const, layers: [] },
      ],
    };
    const mapped = mapPageLayers(scene, 'p1', () => []);
    expect(mapped.pages[0]!.layers).toEqual([]);
    expect(mapped.pages[1]!.layers).toEqual([]);
  });
});
