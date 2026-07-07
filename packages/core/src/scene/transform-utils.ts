import type { Transform } from './types';

export const MIN_LAYER_SIZE = 8;

export function clampTransformSize(transform: Transform): Transform {
  return {
    ...transform,
    width: Math.max(MIN_LAYER_SIZE, Math.abs(transform.width)),
    height: Math.max(MIN_LAYER_SIZE, Math.abs(transform.height)),
  };
}
