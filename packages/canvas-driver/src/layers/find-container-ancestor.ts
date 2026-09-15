import type Konva from 'konva';

import type { FlattenedStageLayer } from '../flatten-layer-surface';
import { isCanvasContainerLayerType } from './is-canvas-container-layer';

/**
 * Walk Konva parents for the nearest canvas.group / openenvx.widget ancestor.
 */
export function findContainerAncestorId(
  start: Konva.Node | null | undefined,
  layers: readonly FlattenedStageLayer[],
  options?: { excludeId?: string }
): string | null {
  let current: Konva.Node | null | undefined = start;
  while (current) {
    const id = current.name?.() ?? '';
    if (id && id !== options?.excludeId) {
      const entry = layers.find((item) => item.layer.id === id);
      if (entry && isCanvasContainerLayerType(entry.layer.type)) {
        return id;
      }
    }
    current = current.getParent();
  }
  return null;
}
