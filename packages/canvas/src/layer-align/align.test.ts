import { describe, expect, it } from 'vitest';

import { createDefaultTransform } from '@openenvx/core/schema';

import { alignTransforms, distributeHorizontally } from './align';

describe('align', () => {
  it('alignTransforms aligns left edges', () => {
    const transforms = [
      { ...createDefaultTransform(), width: 40, x: 10 },
      { ...createDefaultTransform(), width: 20, x: 80 },
    ];
    const aligned = alignTransforms(transforms, 'left');
    expect(aligned.every((t) => t.x === 10)).toBeTruthy();
  });

  it('distributeHorizontally spaces layers evenly', () => {
    const transforms = [
      { ...createDefaultTransform(), width: 20, x: 0 },
      { ...createDefaultTransform(), width: 20, x: 40 },
      { ...createDefaultTransform(), width: 20, x: 120 },
    ];
    const distributed = distributeHorizontally(transforms);
    expect(distributed.map((entry) => entry.x)).toEqual([0, 60, 120]);
  });

  it('distributeHorizontally preserves selection order when applying x positions', () => {
    const transforms = [
      { ...createDefaultTransform(), width: 20, x: 120 },
      { ...createDefaultTransform(), width: 20, x: 0 },
      { ...createDefaultTransform(), width: 20, x: 40 },
    ];
    const distributed = distributeHorizontally(transforms);
    expect(distributed.map((entry) => entry.x)).toEqual([120, 0, 60]);
  });
});
