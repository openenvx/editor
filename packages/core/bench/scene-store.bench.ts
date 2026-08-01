import { bench, describe } from 'vitest';

import { SceneStore } from '../src/scene/scene-store';
import { buildSyntheticScene, nudgeFirstLayer } from './synthetic-scene';

const SIZES = [100, 500, 2000] as const;

for (const size of SIZES) {
  describe(`SceneStore @ ${size} layers`, () => {
    const scene = buildSyntheticScene(size);

    bench('apply (nudge first layer)', () => {
      const store = new SceneStore(scene);
      store.apply({
        apply: nudgeFirstLayer,
        label: 'nudge',
      });
    });

    bench('getSnapshot', () => {
      const store = new SceneStore(scene);
      store.getSnapshot();
    });

    bench('100 undo steps (memory retained)', () => {
      const store = new SceneStore(scene);
      for (let i = 0; i < 100; i += 1) {
        store.apply({
          apply: nudgeFirstLayer,
          label: `nudge-${i}`,
        });
      }
      // Walk history via undo so the engine cannot elide retention.
      let steps = 0;
      while (store.undo()) {
        steps += 1;
      }
      if (steps < 100) {
        throw new Error(`expected 100 undos, got ${steps}`);
      }
    });
  });
}
