import { describe, expect, it } from 'vitest';

import { createDefaultFrame } from '@openenvx/studio/schema';

import { alignTransforms, distributeHorizontally } from './align';

describe('align', () => {
  it('alignTransforms aligns left edges', () => {
    const transforms = [
      { ...createDefaultFrame(), width: 40, x: 10 },
      { ...createDefaultFrame(), width: 20, x: 80 },
    ];
    const aligned = alignTransforms(transforms, 'left');
    expect(aligned.every((t) => t.x === 10)).toBeTruthy();
  });

  it('distributeHorizontally spaces layers evenly', () => {
    const transforms = [
      { ...createDefaultFrame(), width: 20, x: 0 },
      { ...createDefaultFrame(), width: 20, x: 40 },
      { ...createDefaultFrame(), width: 20, x: 120 },
    ];
    const distributed = distributeHorizontally(transforms);
    expect(distributed.map((entry) => entry.x)).toEqual([0, 60, 120]);
  });

  it('distributeHorizontally preserves selection order when applying x positions', () => {
    const transforms = [
      { ...createDefaultFrame(), width: 20, x: 120 },
      { ...createDefaultFrame(), width: 20, x: 0 },
      { ...createDefaultFrame(), width: 20, x: 40 },
    ];
    const distributed = distributeHorizontally(transforms);
    expect(distributed.map((entry) => entry.x)).toEqual([120, 0, 60]);
  });
});
