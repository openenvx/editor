import type { Scene } from '@openenvx/studio/schema';
import { useMemo } from 'react';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { mapLayerSurfaceForVariablePreview } from './map-layer-surface-for-variable-preview';

/** Konva display surface; remeasures when webfonts finish loading (`fontLoadRevision`). */
export function useDisplayLayerSurface(
  layerSurface: CanvasLayerSurfaceItem[],
  scene: Scene | undefined,
  fontLoadRevision: number
): CanvasLayerSurfaceItem[] {
  return useMemo(() => {
    // ponytail: bust cache when useCanvasFontPreload bumps DOM text metrics (hug/preview).
    void fontLoadRevision;
    if (!scene) {
      return layerSurface;
    }
    return mapLayerSurfaceForVariablePreview(layerSurface, scene);
  }, [fontLoadRevision, layerSurface, scene]);
}
