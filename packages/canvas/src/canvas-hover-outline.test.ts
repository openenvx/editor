import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from 'vitest';

import { resolveHoverOutlineRect, readLiveHoverOutlineRect } from './canvas-hover-outline';
import type { FlattenedStageLayer } from './flatten-layer-surface';
import { flattenStageLayers } from './flatten-layer-surface';

/**
 * Hover outline must use absoluteTransform from flattenStageLayers — relative
 * face-child coords would paint at the artboard origin while content sits under
 * the widget parent offset.
 */
describe('widget face hover outline transforms', () => {
  it('composes nested face children under the widget origin', () => {
    const widgetTransform = {
      ...createDefaultTransform(),
      x: 40,
      y: 40,
      width: 200,
      height: 216,
    };
    const bg = {
      layer: {
        id: 'w:bg',
        type: 'canvas.rect',
        transform: {
          ...createDefaultTransform(),
          x: 0,
          y: 0,
          width: 200,
          height: 216,
        },
        data: {},
      },
      view: { kind: 'rect' as const, fill: '#fff' },
    };
    const surface = [
      {
        layer: {
          id: 'w',
          type: 'openenvx.widget',
          transform: widgetTransform,
          data: { children: [bg.layer] },
        },
        view: {
          kind: 'stack' as const,
          direction: 'vertical' as const,
          children: [],
        },
        children: [bg],
      },
    ];

    const flat = flattenStageLayers(surface);
    const face = flat.find((entry) => entry.layer.id === 'w:bg') as
      | FlattenedStageLayer
      | undefined;

    expect(face?.absoluteTransform).toMatchObject({
      x: 40,
      y: 40,
      width: 200,
      height: 216,
    });
    // Relative alone is the bug the outline used to paint with:
    expect(face?.layer.transform).toMatchObject({ x: 0, y: 0 });
  });
});

describe('resolveHoverOutlineRect', () => {
  it('hugs group children AABB in artboard space', () => {
    const childA = {
      layer: {
        id: 'a',
        type: 'canvas.rect',
        transform: {
          ...createDefaultTransform(),
          x: 10,
          y: 40,
          width: 40,
          height: 40,
        },
        data: {},
      },
      view: { kind: 'rect' as const },
    };
    const childB = {
      layer: {
        id: 'b',
        type: 'canvas.rect',
        transform: {
          ...createDefaultTransform(),
          x: 100,
          y: 20,
          width: 40,
          height: 40,
        },
        data: {},
      },
      view: { kind: 'rect' as const },
    };
    const group = {
      layer: {
        id: 'g',
        type: 'canvas.group',
        transform: {
          ...createDefaultTransform(),
          x: 100,
          y: 100,
          width: 400,
          height: 200,
        },
        data: { children: [childA.layer, childB.layer] },
      },
      view: { kind: 'group' as const },
      children: [childA, childB],
      absoluteTransform: {
        ...createDefaultTransform(),
        x: 100,
        y: 100,
        width: 400,
        height: 200,
      },
    } as FlattenedStageLayer;

    expect(resolveHoverOutlineRect(group)).toMatchObject({
      x: 110,
      y: 120,
      width: 130,
      height: 60,
    });
  });
});

describe('readLiveHoverOutlineRect', () => {
  it('reads the node client rect relative to the artboard', () => {
    const artboard = {} as never;
    const node = {
      getClientRect: (cfg: { relativeTo: unknown; skipStroke: boolean }) => {
        expect(cfg.relativeTo).toBe(artboard);
        expect(cfg.skipStroke).toBe(true);
        return { x: 12, y: 34, width: 56, height: 78 };
      },
    } as never;
    expect(readLiveHoverOutlineRect(node, artboard)).toMatchObject({
      x: 12,
      y: 34,
      width: 56,
      height: 78,
      rotation: 0,
    });
  });
});
