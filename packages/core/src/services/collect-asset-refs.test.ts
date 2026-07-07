import { createEmptyScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { collectAssetRefs } from './collect-asset-refs';

function createLayer(id: string, type: string, data: unknown) {
  return { data, id, type };
}

describe(collectAssetRefs, () => {
  it('finds asset refs in layer data', () => {
    const scene = {
      ...createEmptyScene(),
      pages: [
        {
          ...createEmptyScene().pages[0]!,
          layers: [createLayer('1', 'image', { assetRef: 'asset://img-1' })],
        },
      ],
    };

    expect(collectAssetRefs(scene)).toEqual(new Set(['img-1']));
  });

  it('finds asset refs inside nested containers', () => {
    const scene = {
      ...createEmptyScene(),
      pages: [
        {
          ...createEmptyScene().pages[0]!,
          layers: [
            createLayer('1', 'container', {
              children: [
                createLayer('2', 'image', { assetRef: 'asset://nested' }),
              ],
            }),
          ],
        },
      ],
    };

    expect(collectAssetRefs(scene)).toEqual(new Set(['nested']));
  });

  it('ignores http, https, and data refs', () => {
    const scene = {
      ...createEmptyScene(),
      pages: [
        {
          ...createEmptyScene().pages[0]!,
          layers: [
            createLayer('1', 'image', {
              assetRef: 'https://example.com/image.png',
            }),
          ],
        },
      ],
    };

    expect(collectAssetRefs(scene)).toEqual(new Set());
  });

  it('handles multiple refs on the same layer', () => {
    const scene = {
      ...createEmptyScene(),
      pages: [
        {
          ...createEmptyScene().pages[0]!,
          layers: [
            createLayer('1', 'image', {
              dark: { assetRef: 'asset://dark' },
              light: { assetRef: 'asset://light' },
            }),
          ],
        },
      ],
    };

    expect(collectAssetRefs(scene)).toEqual(new Set(['dark', 'light']));
  });
});
