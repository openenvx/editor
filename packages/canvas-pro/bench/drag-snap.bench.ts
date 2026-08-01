import { bench, describe } from 'vitest';

import { computeDragSnap } from '../src/snap/smart-guides/drag-snap';
import { toSnapBounds } from '../src/snap/smart-guides/snap-bounds';
import type { SnapTarget } from '../src/snap/smart-guides/types';

function makeTargets(count: number): SnapTarget[] {
  const out: SnapTarget[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      bounds: toSnapBounds((i % 40) * 50, Math.floor(i / 40) * 50, 40, 40),
      layerType: 'canvas.rect',
    });
  }
  return out;
}

for (const size of [100, 500, 2000] as const) {
  describe(`computeDragSnap @ ${size} peers`, () => {
    const others = makeTargets(size);
    const moving = makeTargets(1)[0]!;

    bench('drag snap over peers', () => {
      computeDragSnap({
        artboard: { width: 2000, height: 2000 },
        moving,
        others,
        threshold: 5,
      });
    });
  });
}
