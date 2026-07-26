import { describe, expect, it } from 'vitest';

import type { Layer } from '@openenvx/schema';

import {
  createBlock,
  findBlock,
  insertAt,
  moveTo,
  removeById,
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
});
