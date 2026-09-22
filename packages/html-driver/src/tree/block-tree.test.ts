import { nodeProps } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  blockProps,
  testHtmlArtboard,
  testHtmlBlock,
  testHtmlDocument,
} from '../test/document-fixtures';
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

describe('block-tree', () => {
  it('finds nested blocks and reports parent', () => {
    const layers = [
      testHtmlBlock('root', 'html.root', [
        testHtmlBlock('a', 'html.heading'),
        testHtmlBlock('c', 'html.flex', [testHtmlBlock('b', 'html.text')]),
      ]),
    ];
    expect(findBlock(layers, 'b')).toEqual({
      block: expect.objectContaining({ id: 'b' }),
      index: 0,
      parentId: 'c',
    });
  });

  it('inserts, moves, updates, and removes', () => {
    let layers = [testHtmlBlock('root', 'html.root', [])];
    const heading = createBlock('html.heading', 'h1', { html: 'Hi' });
    layers = insertAt(layers, 'root', heading, 0);
    expect(findBlock(layers, 'h1')?.parentId).toBe('root');

    const flex = createBlock('html.flex', 'box', { children: [] });
    layers = insertAt(layers, 'root', flex, 1);
    layers = moveTo(layers, 'h1', 'box', 0);
    expect(findBlock(layers, 'h1')?.parentId).toBe('box');

    layers = updateBlockData(layers, 'h1', { html: 'Hello' });
    expect(blockProps(findBlock(layers, 'h1')!.block).html).toBe('Hello');

    layers = removeById(layers, 'h1');
    expect(findBlock(layers, 'h1')).toBeNull();
  });

  it('refuses to move a block into itself', () => {
    const layers = [
      testHtmlBlock('root', 'html.root', [testHtmlBlock('box', 'html.flex', [])]),
    ];
    expect(moveTo(layers, 'box', 'box', 0)).toBe(layers);
  });

  it('clones nested trees, reports root and sibling counts', () => {
    const nested = testHtmlBlock('root', 'html.root', [
      testHtmlBlock('box', 'html.flex', [testHtmlBlock('a', 'html.text')]),
    ]);
    const clone = cloneBlockWithNewIds(nested, (type) => `${type}-new`);
    expect(clone.id).toBe('html.root-new');
    expect(clone.id).not.toBe('root');
    const children = clone.children ?? [];
    expect(children[0]!.id).toBe('html.flex-new');
    expect(children[0]!.children?.[0]!.id).toBe('html.text-new');

    const fromDefaults = createBlock('html.flex', 'box-1', {
      children: [{ id: 'fixed-child', type: 'html.text', data: { html: 'x' } }],
    });
    const minted = fromDefaults.children?.[0];
    expect(fromDefaults.id).toBe('box-1');
    expect(minted?.id).not.toBe('fixed-child');
    expect(minted?.type).toBe('html.text');

    const bare = cloneBlockWithNewIds(
      { id: 'x', type: 'html.text', data: null } as never,
      () => 'fresh'
    );
    expect(bare.id).toBe('fresh');
    expect(nodeProps(bare)).toEqual({});

    expect(
      getPageRootId(
        testHtmlArtboard({
          id: 'p',
          nodes: [testHtmlBlock('root', 'html.root')],
        })
      )
    ).toBe('root');
    expect(
      getPageRootId(
        testHtmlArtboard({
          id: 'p',
          nodes: [testHtmlBlock('event', 'snapvelo.root')],
        })
      )
    ).toBe('event');
    expect(
      getPageRootId(testHtmlArtboard({ id: 'p', nodes: [] }))
    ).toBeNull();

    const layers = [testHtmlBlock('root', 'html.root', [testHtmlBlock('a', 'html.text')])];
    expect(siblingCount(layers, null)).toBe(1);
    expect(siblingCount(layers, 'root')).toBe(1);
    expect(siblingCount(layers, 'missing')).toBe(0);

    expect(insertAt(layers, null, createBlock('html.text', 'top', {}), 0)[0]!
      .id).toBe('top');
    expect(moveTo(layers, 'missing', 'root', 0)).toBe(layers);
    expect(moveTo(layers, 'a', 'a', 0)).toBe(layers);

    const updated = updateBlockData(
      [{ id: 'n', type: 'html.text', props: {} }],
      'n',
      { html: 'x' }
    );
    expect(nodeProps(updated[0]!)).toEqual({ html: 'x' });

    const scene = testHtmlDocument([
      testHtmlArtboard({ id: 'p1', nodes: layers }),
      testHtmlArtboard({ id: 'p2', nodes: [] }),
    ]);
    const mapped = mapPageLayers(scene, 'p1', () => []);
    expect(mapped.artboards[0]!.nodes).toEqual([]);
    expect(mapped.artboards[1]!.nodes).toEqual([]);
  });
});
