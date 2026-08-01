import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from 'vitest';

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
        view: { kind: 'stack' as const, direction: 'vertical' as const, children: [] },
        children: [bg],
      },
    ];

    const flat = flattenStageLayers(surface);
    const face = flat.find((entry) => entry.layer.id === 'w:bg') as
      | FlattenedStageLayer
      | undefined;

    expect(face?.absoluteTransform).toMatchObject({ x: 40, y: 40, width: 200, height: 216 });
    // Relative alone is the bug the outline used to paint with:
    expect(face?.layer.transform).toMatchObject({ x: 0, y: 0 });
  });
});
