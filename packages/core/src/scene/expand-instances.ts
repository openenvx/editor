import type { CanvasInstanceData, SceneComponent } from '@openenvx/core/schema';

import { getLayerChildren, hasChildLayers } from './layer-tree';
import type { Layer, Scene } from './types';

export const CANVAS_INSTANCE_LAYER_TYPE = 'canvas.instance';

/** Separates instance layer id from definition layer id in surface-only child ids. */
export const INSTANCE_SURFACE_CHILD_SEP = '::';

export function buildInstanceSurfaceLayerId(
  instanceLayerId: string,
  definitionLayerId: string
): string {
  return `${instanceLayerId}${INSTANCE_SURFACE_CHILD_SEP}${definitionLayerId}`;
}

function remapLayerForInstanceSurface(
  instanceLayerId: string,
  layer: Layer
): Layer {
  const id = buildInstanceSurfaceLayerId(instanceLayerId, layer.id);
  const surfaceLayer: Layer = {
    ...layer,
    id,
    locked: true,
    writeMode: 'locked',
  };
  if (!hasChildLayers(layer)) {
    return surfaceLayer;
  }
  const data = layer.data as { children: Layer[] };
  return {
    ...surfaceLayer,
    data: {
      ...data,
      children: getLayerChildren(layer).map((child) =>
        remapLayerForInstanceSurface(instanceLayerId, child)
      ),
    },
  };
}

function remapLayersForInstanceSurface(
  instanceLayerId: string,
  layers: Layer[]
): Layer[] {
  return layers.map((layer) =>
    remapLayerForInstanceSurface(instanceLayerId, layer)
  );
}

export function isCanvasInstanceLayer(layer: Layer): boolean {
  return layer.type === CANVAS_INSTANCE_LAYER_TYPE;
}

export function getInstanceComponentId(layer: Layer): string | null {
  if (!isCanvasInstanceLayer(layer)) {
    return null;
  }
  const componentId = (layer.data as CanvasInstanceData | undefined)
    ?.componentId;
  return typeof componentId === 'string' && componentId ? componentId : null;
}

/** Definition layers for an instance, with optional shallow data overrides applied. */
export function resolveInstanceDefinitionLayers(
  layer: Layer,
  components: Record<string, SceneComponent> | undefined
): Layer[] {
  const componentId = getInstanceComponentId(layer);
  if (!componentId) {
    return [];
  }
  const definition = components?.[componentId];
  if (!definition) {
    return [];
  }
  const overrides = (layer.data as CanvasInstanceData).overrides;
  if (!overrides) {
    return definition.layers;
  }
  return definition.layers.map((child) => {
    const patch = overrides[child.id];
    if (!patch) {
      return child;
    }
    const data =
      typeof child.data === 'object' && child.data !== null
        ? { ...(child.data as Record<string, unknown>), ...patch }
        : patch;
    return { ...child, data } as Layer;
  });
}

/** Children for surface/export: instance → component layers; else data.children. */
export function getLayerChildrenForScene(layer: Layer, scene: Scene): Layer[] {
  if (isCanvasInstanceLayer(layer)) {
    const definitionLayers = resolveInstanceDefinitionLayers(
      layer,
      scene.components
    );
    return remapLayersForInstanceSurface(layer.id, definitionLayers);
  }
  return getLayerChildren(layer);
}
