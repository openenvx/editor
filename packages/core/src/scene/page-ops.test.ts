import { describe, expect, it } from 'vitest';

import type { Page } from './types';
import {
  createBlankPageLike,
  duplicatePageModel,
  duplicatePageName,
  movePageRelativeToTarget,
  nextPageName,
} from './page-ops';

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page-1',
    name: 'Page 1',
    layout: 'absolute',
    width: 800,
    height: 600,
    unit: 'px',
    dpi: 96,
    presetId: 'custom',
    backgroundColor: '#ffffff',
    layers: [],
    ...overrides,
  };
}

describe('page-ops', () => {
  it('createBlankPageLike copies layout settings with empty layers', () => {
    const source = makePage({
      layers: [{ id: 'a', type: 'canvas.rect', data: {} }],
    });
    const blank = createBlankPageLike(source, 'page-2', 'Page 2');
    expect(blank).toMatchObject({
      id: 'page-2',
      name: 'Page 2',
      layout: 'absolute',
      width: 800,
      height: 600,
      unit: 'px',
      dpi: 96,
      presetId: 'custom',
      backgroundColor: '#ffffff',
      layers: [],
    });
  });

  it('duplicatePageModel clones layers with new ids', () => {
    const source = makePage({
      layers: [
        {
          id: 'group-1',
          type: 'canvas.group',
          data: {
            children: [{ id: 'child-1', type: 'canvas.rect', data: {} }],
          },
        },
      ],
    });
    const dup = duplicatePageModel(source, 'page-2', 'Page 1 copy');
    expect(dup.id).toBe('page-2');
    expect(dup.layers).toHaveLength(1);
    expect(dup.layers[0]!.id).not.toBe('group-1');
    const children = (dup.layers[0]!.data as { children: { id: string }[] })
      .children;
    expect(children[0]!.id).not.toBe('child-1');
  });

  it('names helpers', () => {
    expect(nextPageName(['Page 1'])).toBe('Page 2');
    expect(nextPageName(['Page 1', 'Page 3'])).toBe('Page 2');
    expect(nextPageName(['Cover', 'Page 2'])).toBe('Page 1');
    expect(duplicatePageName('Cover')).toBe('Cover copy');
    expect(duplicatePageName('  ')).toBe('Page copy');
  });

  it('movePageRelativeToTarget reorders pages', () => {
    const pages = [
      makePage({ id: 'a', name: 'A' }),
      makePage({ id: 'b', name: 'B' }),
      makePage({ id: 'c', name: 'C' }),
    ];
    expect(
      movePageRelativeToTarget(pages, 'c', 'a', 'before').map((p) => p.id)
    ).toStrictEqual(['c', 'a', 'b']);
    expect(
      movePageRelativeToTarget(pages, 'a', 'c', 'after').map((p) => p.id)
    ).toStrictEqual(['b', 'c', 'a']);
  });
});
