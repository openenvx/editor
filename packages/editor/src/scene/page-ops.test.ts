import { describe, expect, it } from 'vitest';

import type { Artboard } from './types';
import {
  createBlankArtboardLike,
  duplicateArtboardModel,
  duplicateArtboardName,
  moveArtboardRelativeToTarget,
  nextArtboardName,
} from './page-ops';

function makeArtboard(overrides: Partial<Artboard> = {}): Artboard {
  return {
    background: '#ffffff',
    extensions: { layout: 'absolute' },
    id: 'page-1',
    name: 'Page 1',
    nodes: [],
    physical: { dpi: 96, presetId: 'custom', unit: 'px' },
    space: { height: 600, width: 800 },
    ...overrides,
  };
}

describe('page-ops', () => {
  it('createBlankArtboardLike copies layout settings with empty nodes', () => {
    const source = makeArtboard({
      nodes: [{ id: 'a', props: {}, type: 'canvas.rect' }],
    });
    const blank = createBlankArtboardLike(source, 'page-2', 'Page 2');
    expect(blank).toMatchObject({
      background: '#ffffff',
      extensions: { layout: 'absolute' },
      id: 'page-2',
      name: 'Page 2',
      nodes: [],
      physical: { dpi: 96, presetId: 'custom', unit: 'px' },
      space: { height: 600, width: 800 },
    });
  });

  it('duplicateArtboardModel clones nodes with new ids', () => {
    const source = makeArtboard({
      nodes: [
        {
          children: [{ id: 'child-1', props: {}, type: 'canvas.rect' }],
          id: 'group-1',
          type: 'canvas.group',
        },
      ],
    });
    const dup = duplicateArtboardModel(source, 'page-2', 'Page 1 copy');
    expect(dup.id).toBe('page-2');
    expect(dup.nodes).toHaveLength(1);
    expect(dup.nodes[0]!.id).not.toBe('group-1');
    expect(dup.nodes[0]!.children?.[0]!.id).not.toBe('child-1');
  });

  it('names helpers', () => {
    expect(nextArtboardName(['Artboard 1'])).toBe('Artboard 2');
    expect(nextArtboardName(['Artboard 1', 'Artboard 3'])).toBe('Artboard 2');
    expect(nextArtboardName(['Cover', 'Artboard 2'])).toBe('Artboard 1');
    expect(duplicateArtboardName('Cover')).toBe('Cover copy');
    expect(duplicateArtboardName('  ')).toBe('Artboard copy');
  });

  it('moveArtboardRelativeToTarget reorders artboards', () => {
    const artboards = [
      makeArtboard({ id: 'a', name: 'A' }),
      makeArtboard({ id: 'b', name: 'B' }),
      makeArtboard({ id: 'c', name: 'C' }),
    ];
    expect(
      moveArtboardRelativeToTarget(artboards, 'c', 'a', 'before').map((p) => p.id)
    ).toStrictEqual(['c', 'a', 'b']);
    expect(
      moveArtboardRelativeToTarget(artboards, 'a', 'c', 'after').map((p) => p.id)
    ).toStrictEqual(['b', 'c', 'a']);
  });
});
