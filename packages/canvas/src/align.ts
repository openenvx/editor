import type { Transform } from '@openenvx/schema';

export interface AlignBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getLayerBounds(transform: Transform): AlignBounds {
  return {
    height: transform.height,
    width: transform.width,
    x: transform.x,
    y: transform.y,
  };
}
