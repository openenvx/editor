import type { Layer, Page, Scene } from './types';

export const CONTAINER_LAYER_TYPE = 'container';

export interface ContainerLayoutModel {
  layout: 'row' | 'column';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between';
  children: Layer[];
}

export function isContainerLayer(layer: Layer): boolean {
  return layer.type === CONTAINER_LAYER_TYPE;
}

export function getContainerChildren(layer: Layer): Layer[] {
  if (!isContainerLayer(layer)) {
    return [];
  }
  return getLayerChildren(layer);
}

export function hasChildLayers(layer: Layer): boolean {
  const data = layer.data;
  if (!data || typeof data !== 'object') {
    return false;
  }
  return (
    'children' in data &&
    Array.isArray((data as { children: unknown }).children)
  );
}

export function getLayerChildren(layer: Layer): Layer[] {
  if (!hasChildLayers(layer)) {
    return [];
  }
  const data = layer.data as { children: Layer[] };
  return data.children;
}

function mapLayerChildren(
  layer: Layer,
  mapper: (layers: Layer[]) => Layer[]
): Layer {
  if (!hasChildLayers(layer)) {
    return layer;
  }
  const data = layer.data as { children: Layer[] };
  return {
    ...layer,
    data: {
      ...data,
      children: mapper(data.children ?? []),
    },
  };
}

export function walkLayers(
  layers: Layer[],
  visitor: (layer: Layer, path: Layer[]) => void,
  path: Layer[] = []
): void {
  for (const layer of layers) {
    visitor(layer, path);
    if (hasChildLayers(layer)) {
      walkLayers(getLayerChildren(layer), visitor, [...path, layer]);
    }
  }
}

export function findLayerById(scene: Scene, layerId: string): Layer | null {
  for (const page of scene.pages) {
    let found: Layer | null = null;
    walkLayers(page.layers, (layer) => {
      if (layer.id === layerId) {
        found = layer;
      }
    });
    if (found) {
      return found;
    }
  }
  return null;
}

export function findLayerPage(scene: Scene, layerId: string): Page | null {
  for (const page of scene.pages) {
    let found = false;
    walkLayers(page.layers, (layer) => {
      if (layer.id === layerId) {
        found = true;
      }
    });
    if (found) {
      return page;
    }
  }
  return null;
}

export function layerExistsOnPage(page: Page, layerId: string): boolean {
  let exists = false;
  walkLayers(page.layers, (layer) => {
    if (layer.id === layerId) {
      exists = true;
    }
  });
  return exists;
}

export function mapLayers(
  layers: Layer[],
  mapper: (layer: Layer) => Layer
): Layer[] {
  return layers.map((layer) => {
    const next = mapper(layer);
    return mapLayerChildren(next, (children) => mapLayers(children, mapper));
  });
}

/** Create a stable layer id from a layer type stem. */
export function createLayerId(type: string): string {
  const stem = type.replace(/^canvas\./, '') || 'layer';
  return `${stem}-${crypto.randomUUID()}`;
}

/** Deep-clone a layer tree, assigning new ids to every node (including nested children). */
export function cloneLayerTree(layers: Layer[]): Layer[] {
  return layers.map((layer) => {
    const cloned = structuredClone(layer);
    cloned.id = createLayerId(layer.type);
    if (hasChildLayers(cloned)) {
      const data = cloned.data as { children: Layer[] };
      cloned.data = {
        ...data,
        children: cloneLayerTree(data.children ?? []),
      };
    }
    return cloned;
  });
}

export function updateLayerInTree(
  layers: Layer[],
  layerId: string,
  updater: (layer: Layer) => Layer
): Layer[] {
  return layers.map((layer) => {
    if (layer.id === layerId) {
      return updater(layer);
    }
    return mapLayerChildren(layer, (children) =>
      updateLayerInTree(children, layerId, updater)
    );
  });
}

export function removeLayerFromTree(layers: Layer[], layerId: string): Layer[] {
  return layers
    .filter((layer) => layer.id !== layerId)
    .map((layer) =>
      mapLayerChildren(layer, (children) =>
        removeLayerFromTree(children, layerId)
      )
    );
}

export function insertLayerIntoContainer(
  layers: Layer[],
  containerId: string,
  child: Layer,
  index?: number
): Layer[] {
  return layers.map((layer) => {
    if (layer.id === containerId && isContainerLayer(layer)) {
      const data = layer.data as { children: Layer[] };
      const children = [...(data.children ?? [])];
      const at = index ?? children.length;
      children.splice(at, 0, child);
      return {
        ...layer,
        data: { ...data, children },
      };
    }
    return mapLayerChildren(layer, (children) =>
      insertLayerIntoContainer(children, containerId, child, index)
    );
  });
}

export function moveLayerInTree(
  layers: Layer[],
  layerId: string,
  targetIndex: number,
  parentContainerId?: string | null
): Layer[] {
  let moving: Layer | null = null;
  walkLayers(layers, (layer) => {
    if (layer.id === layerId) {
      moving = layer;
    }
  });
  if (!moving) {
    return layers;
  }

  const without = removeLayerFromTree(layers, layerId);

  if (parentContainerId) {
    return insertLayerIntoContainer(
      without,
      parentContainerId,
      moving,
      targetIndex
    );
  }

  const clamped = Math.max(0, Math.min(targetIndex, without.length));
  const result = [...without];
  result.splice(clamped, 0, moving);
  return result;
}

interface LayerLocation {
  parentLayers: Layer[];
  index: number;
  containerId: string | null;
}

export function findLayerLocation(
  layers: Layer[],
  layerId: string,
  containerId: string | null = null
): LayerLocation | null {
  const index = layers.findIndex((layer) => layer.id === layerId);
  if (index !== -1) {
    return { containerId, index, parentLayers: layers };
  }
  for (const layer of layers) {
    if (hasChildLayers(layer)) {
      const children = getLayerChildren(layer);
      const nested = findLayerLocation(children, layerId, layer.id);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function moveLayerRelativeToTarget(
  layers: Layer[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside'
): Layer[] {
  let moving: Layer | null = null;
  walkLayers(layers, (layer) => {
    if (layer.id === sourceId) {
      moving = layer;
    }
  });
  if (!moving || sourceId === targetId) {
    return layers;
  }

  const without = removeLayerFromTree(layers, sourceId);

  if (position === 'inside') {
    return insertLayerIntoContainer(without, targetId, moving);
  }

  const targetLoc = findLayerLocation(without, targetId);
  if (!targetLoc) {
    return layers;
  }

  const insertIndex =
    position === 'before' ? targetLoc.index : targetLoc.index + 1;

  if (targetLoc.containerId) {
    return updateLayerInTree(without, targetLoc.containerId, (container) => {
      const data = container.data as { children: Layer[] };
      const children = [...(data.children ?? [])];
      children.splice(insertIndex, 0, moving!);
      return {
        ...container,
        data: { ...data, children },
      };
    });
  }

  const roots = [...without];
  roots.splice(insertIndex, 0, moving);
  return roots;
}

export function getLayerAncestorIds(page: Page, layerId: string): string[] {
  let ancestorIds: string[] = [];
  walkLayers(page.layers, (layer, path) => {
    if (layer.id === layerId) {
      ancestorIds = path.map((ancestor) => ancestor.id);
    }
  });
  return ancestorIds;
}

export function isLayerDescendant(
  layers: Layer[],
  ancestorId: string,
  candidateId: string
): boolean {
  if (ancestorId === candidateId) {
    return false;
  }

  let descendant = false;
  walkLayers(layers, (layer, path) => {
    if (
      layer.id === candidateId &&
      path.some((ancestor) => ancestor.id === ancestorId)
    ) {
      descendant = true;
    }
  });
  return descendant;
}
