import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from 'vitest';

import { flattenStageLayers } from '../flatten-layer-surface';
import { findContainerAncestorId } from './find-container-ancestor';
import { isCanvasContainerLayerType } from './is-canvas-container-layer';

describe(isCanvasContainerLayerType, () => {
  it('treats group and widget as containers', () => {
    expect(isCanvasContainerLayerType('canvas.group')).toBe(true);
    expect(isCanvasContainerLayerType('openenvx.widget')).toBe(true);
    expect(isCanvasContainerLayerType('canvas.rect')).toBe(false);
  });
});

describe(findContainerAncestorId, () => {
  it('resolves the widget envelope above a face child via flattened tree', () => {
    const surface = [
      {
        layer: {
          id: 'w',
          type: 'openenvx.widget',
          transform: {
            ...createDefaultTransform(),
            x: 40,
            y: 40,
            width: 200,
            height: 200,
          },
          data: { children: [] },
        },
        view: { kind: 'rect' as const, fill: 'transparent' },
        children: [
          {
            layer: {
              id: 'w:text',
              type: 'canvas.text',
              transform: {
                ...createDefaultTransform(),
                x: 16,
                y: 16,
                width: 100,
                height: 20,
              },
              data: { html: 'Hi' },
            },
            view: { kind: 'richText' as const, html: 'Hi' },
          },
        ],
      },
    ];
    const flat = flattenStageLayers(surface);
    // Without Konva parents, only a node named as the widget itself matches.
    const fakeChild = {
      name: () => 'w:text',
      getParent: () => ({
        name: () => 'w',
        getParent: () => null,
      }),
    };
    expect(
      findContainerAncestorId(fakeChild as never, flat, { excludeId: 'w:text' })
    ).toBe('w');
  });
});
