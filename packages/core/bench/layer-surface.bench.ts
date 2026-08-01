import { bench, describe } from 'vitest';

import { walkLayers } from '../src/scene/layer-tree';
import { buildSyntheticScene } from './synthetic-scene';

/**
 * Stand-in for EditorSliceBuilder's O(n) preview walk (full builder needs
 * WorkbenchSliceContext). Measures tree walk + per-layer object allocation.
 */
for (const size of [100, 500, 2000] as const) {
  describe(`layerSurface walk @ ${size} layers`, () => {
    const scene = buildSyntheticScene(size);
    const layers = scene.pages[0]!.layers;

    bench('walk + allocate surface stubs', () => {
      const surface: { id: string; kind: string; children?: unknown[] }[] = [];
      const visit = (
        layer: (typeof layers)[number]
      ): { id: string; kind: string; children?: unknown[] } => {
        const children =
          layer.type === 'canvas.group' &&
          layer.data &&
          typeof layer.data === 'object' &&
          'children' in layer.data &&
          Array.isArray((layer.data as { children: unknown }).children)
            ? (
                layer.data as {
                  children: (typeof layers)[number][];
                }
              ).children.map(visit)
            : undefined;
        return {
          id: layer.id,
          kind: layer.type,
          children,
        };
      };
      for (const layer of layers) {
        surface.push(visit(layer));
      }
      // Touch result so the engine cannot DCE the walk.
      if (surface.length === 0) {
        throw new Error('empty');
      }
    });

    bench('walkLayers visitor', () => {
      let count = 0;
      walkLayers(layers, () => {
        count += 1;
      });
      if (count === 0) {
        throw new Error('empty');
      }
    });
  });
}
