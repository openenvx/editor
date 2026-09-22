import { createEmptyScene } from '#studio/schema';
import { describe, expect, it } from 'vitest';

import { collectAssetRefs } from './collect-asset-refs';

function createNode(id: string, type: string, props: unknown) {
  return { id, props: props as Record<string, unknown>, type };
}

describe(collectAssetRefs, () => {
  it('finds asset refs in node props', () => {
    const document = {
      ...createEmptyScene(),
      artboards: [
        {
          ...createEmptyScene().artboards[0]!,
          nodes: [
            createNode('1', 'image', { assetRef: 'asset://img-1' }),
          ],
        },
      ],
    };

    expect(collectAssetRefs(document)).toEqual(new Set(['img-1']));
  });

  it('finds asset refs inside nested containers', () => {
    const document = {
      ...createEmptyScene(),
      artboards: [
        {
          ...createEmptyScene().artboards[0]!,
          nodes: [
            {
              children: [
                createNode('2', 'image', { assetRef: 'asset://nested' }),
              ],
              id: '1',
              props: { layout: 'row' },
              type: 'container',
            },
          ],
        },
      ],
    };

    expect(collectAssetRefs(document)).toEqual(new Set(['nested']));
  });

  it('ignores http, https, and data refs', () => {
    const document = {
      ...createEmptyScene(),
      artboards: [
        {
          ...createEmptyScene().artboards[0]!,
          nodes: [
            createNode('1', 'image', {
              assetRef: 'https://example.com/image.png',
            }),
          ],
        },
      ],
    };

    expect(collectAssetRefs(document)).toEqual(new Set());
  });

  it('handles multiple refs on the same node', () => {
    const document = {
      ...createEmptyScene(),
      artboards: [
        {
          ...createEmptyScene().artboards[0]!,
          nodes: [
            createNode('1', 'image', {
              dark: { assetRef: 'asset://dark' },
              light: { assetRef: 'asset://light' },
            }),
          ],
        },
      ],
    };

    expect(collectAssetRefs(document)).toEqual(new Set(['dark', 'light']));
  });
});
