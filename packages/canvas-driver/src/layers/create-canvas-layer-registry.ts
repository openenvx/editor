import { LayerRegistry } from '@openenvx/studio';

import { builtinCanvasLayerDefinitions } from './builtin-canvas-layer-definitions';

export function createCanvasLayerRegistry(): LayerRegistry {
  const registry = new LayerRegistry();
  for (const definition of builtinCanvasLayerDefinitions()) {
    registry.register(definition);
  }
  return registry;
}
