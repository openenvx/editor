import type {
  FrozenLayerSnapshot,
  LayerWriteMode,
  Scene,
} from '@openenvx/schema';

import type { Layer } from './types';

export function getLayerWriteMode(layer: Layer): LayerWriteMode {
  return layer.writeMode ?? 'free';
}

export function isLayerEditable(layer: Layer): boolean {
  return getLayerWriteMode(layer) !== 'locked';
}

export function isLayerLocked(layer: Layer): boolean {
  return layer.locked === true;
}

export function isLayerVisible(layer: Layer): boolean {
  return layer.visible !== false;
}

export function isLayerWritable(layer: Layer): boolean {
  return isLayerEditable(layer) && !isLayerLocked(layer);
}

export function canSelectLayer(layer: Layer): boolean {
  return getLayerWriteMode(layer) !== 'locked';
}

export function canTransformLayer(layer: Layer): boolean {
  if (!isLayerWritable(layer)) {
    return false;
  }

  return getLayerWriteMode(layer) === 'free';
}

export function canEditLayerData(layer: Layer): boolean {
  if (!isLayerWritable(layer)) {
    return false;
  }

  const mode = getLayerWriteMode(layer);
  return mode === 'free' || mode === 'content' || mode === 'properties';
}

export function canDeleteLayer(layer: Layer, scene: Scene): boolean {
  if (!canTransformLayer(layer)) {
    return false;
  }

  return scene.templatePolicy?.allowDeleteLayers !== false;
}

export function canDuplicateLayer(layer: Layer, scene: Scene): boolean {
  if (!canTransformLayer(layer)) {
    return false;
  }

  return scene.templatePolicy?.allowDuplicateLayers !== false;
}

export function canReorderLayer(layer: Layer): boolean {
  return canTransformLayer(layer);
}

export function canInsertLayers(scene: Scene): boolean {
  return scene.templatePolicy?.allowInsertLayers !== false;
}

export function canResizePage(scene: Scene): boolean {
  return scene.templatePolicy?.allowPageResize !== false;
}

export function buildFrozenLayerSnapshot(
  scene: Scene
): Record<string, FrozenLayerSnapshot> {
  const frozen: Record<string, FrozenLayerSnapshot> = {};

  for (const page of scene.pages) {
    for (const layer of page.layers) {
      const mode = getLayerWriteMode(layer);

      if (mode === 'locked') {
        frozen[layer.id] = {
          data: structuredClone(layer.data),
          ...(layer.transform
            ? { transform: structuredClone(layer.transform) }
            : {}),
        };
        continue;
      }

      if (mode === 'properties' && layer.transform) {
        frozen[layer.id] = {
          transform: structuredClone(layer.transform),
        };
      }
    }
  }

  return frozen;
}
