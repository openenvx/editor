import type { Layer } from './types';

export function isLayerEditable(layer: Layer): boolean {
  return layer.editable !== false;
}

export function isLayerLocked(layer: Layer): boolean {
  return layer.locked === true;
}

export function isLayerWritable(layer: Layer): boolean {
  return isLayerEditable(layer) && !isLayerLocked(layer);
}
