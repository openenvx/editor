import type { Transform } from '@xmazu/openenvxee-schema';
import type React from 'react';

import type { ArtboardOffset } from '../artboard-offset';
import type { ViewportState } from '../viewport';

export interface LayerScreenBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
}

export function getLayerScreenBounds(
  transform: Transform,
  viewport: ViewportState,
  artboardOffset: ArtboardOffset
): LayerScreenBounds {
  return {
    height: transform.height * viewport.zoom,
    left: artboardOffset.x + transform.x * viewport.zoom,
    rotation: transform.rotation,
    top: artboardOffset.y + transform.y * viewport.zoom,
    width: transform.width * viewport.zoom,
  };
}

export function getLayerScreenStyle(
  bounds: LayerScreenBounds
): React.CSSProperties {
  return {
    height: bounds.height,
    left: bounds.left,
    position: 'absolute',
    top: bounds.top,
    transform: bounds.rotation ? `rotate(${bounds.rotation}deg)` : undefined,
    transformOrigin: 'top left',
    width: bounds.width,
  };
}
