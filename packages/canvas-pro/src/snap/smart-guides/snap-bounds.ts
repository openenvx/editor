import { getLayerBounds } from '@openenvx/canvas';
import type { Transform } from '@xmazu/openenvxee-schema';

import type { SnapBounds } from './types';

export function toSnapBounds(
  x: number,
  y: number,
  width: number,
  height: number
): SnapBounds {
  return {
    bottom: y + height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    height,
    left: x,
    right: x + width,
    top: y,
    width,
  };
}

export function snapBoundsFromTransform(transform: Transform): SnapBounds {
  const bounds = getLayerBounds(transform);
  return toSnapBounds(bounds.x, bounds.y, bounds.width, bounds.height);
}

export function computeSnapThreshold(zoom: number): number {
  return 5 / Math.max(zoom, 0.1);
}
