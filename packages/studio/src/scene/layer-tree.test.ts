import type { DocumentNode } from '#studio/schema';
import { describe, expect, it } from 'vitest';

import type { Artboard } from './types';
import {
  cloneLayerTree,
  getLayerAncestorIds,
  getLayerChildren,
  insertLayerIntoContainer,
  isLayerDescendant,
  moveLayerRelativeToTarget,
  updateLayerInTree,
  walkLayers,
} from './layer-tree';

describe('layer-tree', () => {
  const layers: DocumentNode[] = [
    {
      children: [
        { id: 'a', props: { level: 2, text: 'A' }, type: 'heading' },
        { id: 'b', props: { level: 2, text: 'B' }, type: 'heading' },
      ],
      id: 'c1',
      props: { layout: 'row' },
      type: 'container',
    },
    { id: 's1', props: { size: 'md' }, type: 'spacer' },
  ];

  it('walkLayers visits nested children', () => {
    const ids: string[] = [];
    walkLayers(layers, (layer) => ids.push(layer.id));
    expect(ids).toStrictEqual(['c1', 'a', 'b', 's1']);
  });

  it('moveLayerRelativeToTarget reorders root layers', () => {
    const result = moveLayerRelativeToTarget(layers, 's1', 'c1', 'before');
    expect(result.map((l) => l.id)).toStrictEqual(['s1', 'c1']);
  });

  it('isLayerDescendant detects nested children', () => {
    expect(isLayerDescendant(layers, 'c1', 'a')).toBe(true);
    expect(isLayerDescendant(layers, 'c1', 's1')).toBe(false);
    expect(isLayerDescendant(layers, 'a', 'c1')).toBe(false);
  });

  it('getLayerAncestorIds returns ancestor path for nested layers', () => {
    const artboard: Artboard = {
      extensions: { layout: 'flow' },
      id: 'p1',
      name: 'Page',
      nodes: layers,
      physical: { dpi: 96, unit: 'px' },
      space: {},
    };
    expect(getLayerAncestorIds(artboard, 'a')).toStrictEqual(['c1']);
    expect(getLayerAncestorIds(artboard, 'c1')).toStrictEqual([]);
    expect(getLayerAncestorIds(artboard, 'missing')).toStrictEqual([]);
  });

  it('walkLayers visits children on any layer with children', () => {
    const groupLayers: DocumentNode[] = [
      {
        children: [
          {
            id: 'child-1',
            props: { fill: '#000' },
            type: 'canvas.rect',
          },
        ],
        id: 'group-1',
        type: 'canvas.group',
      },
    ];
    const ids: string[] = [];
    walkLayers(groupLayers, (layer) => ids.push(layer.id));
    expect(ids).toStrictEqual(['group-1', 'child-1']);
  });

  it('updateLayerInTree updates nested children in non-container layers', () => {
    const groupLayers: DocumentNode[] = [
      {
        children: [
          {
            id: 'child-1',
            props: { fill: '#000' },
            type: 'canvas.rect',
          },
        ],
        id: 'group-1',
        type: 'canvas.group',
      },
    ];
    const result = updateLayerInTree(groupLayers, 'child-1', (layer) => ({
      ...layer,
      props: { fill: '#fff' },
    }));
    const child = result[0]?.children?.[0];
    expect(child?.props).toStrictEqual({ fill: '#fff' });
  });

  it('insertLayerIntoContainer works for non-container parents with children', () => {
    const groupLayers: DocumentNode[] = [
      {
        children: [],
        id: 'root',
        type: 'html.root',
      },
    ];
    const result = insertLayerIntoContainer(
      groupLayers,
      'root',
      { id: 't1', props: { text: 'Hi' }, type: 'html.text' },
      0
    );
    expect(getLayerChildren(result[0]!).map((l) => l.id)).toStrictEqual(['t1']);
  });

  it('cloneLayerTree remaps ids including nested children', () => {
    const groupLayers: DocumentNode[] = [
      {
        children: [
          {
            id: 'child-1',
            props: { fill: '#000' },
            type: 'canvas.rect',
          },
        ],
        id: 'group-1',
        type: 'canvas.group',
      },
    ];
    const cloned = cloneLayerTree(groupLayers);
    expect(cloned).toHaveLength(1);
    expect(cloned[0]!.id).not.toBe('group-1');
    const children = cloned[0]!.children ?? [];
    expect(children).toHaveLength(1);
    expect(children[0]!.id).not.toBe('child-1');
    expect(children[0]!.props).toStrictEqual({ fill: '#000' });
  });
});
