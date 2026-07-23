import {
  findLayerLocation,
  getLayerChildren,
  insertLayerIntoContainer,
  isLayerDescendant,
  removeLayerFromTree,
  updateLayerInTree,
} from '@openenvx/core';
import type { Layer, Page, Scene } from '@openenvx/schema';

export function findBlock(
  layers: Layer[],
  id: string
): { block: Layer; parentId: string | null; index: number } | null {
  const loc = findLayerLocation(layers, id);
  if (!loc) {
    return null;
  }
  const block = loc.parentLayers[loc.index];
  if (!block) {
    return null;
  }
  return { block, index: loc.index, parentId: loc.containerId };
}

export function removeById(layers: Layer[], id: string): Layer[] {
  return removeLayerFromTree(layers, id);
}

export function insertAt(
  layers: Layer[],
  parentId: string | null,
  block: Layer,
  index: number
): Layer[] {
  if (parentId === null) {
    const next = [...layers];
    const at = Math.max(0, Math.min(index, next.length));
    next.splice(at, 0, block);
    return next;
  }
  return insertLayerIntoContainer(layers, parentId, block, index);
}

export function moveTo(
  layers: Layer[],
  id: string,
  newParentId: string | null,
  index: number
): Layer[] {
  const found = findBlock(layers, id);
  if (!found) {
    return layers;
  }
  if (newParentId === id) {
    return layers;
  }
  if (newParentId !== null && isLayerDescendant(layers, id, newParentId)) {
    return layers;
  }
  const without = removeLayerFromTree(layers, id);
  return insertAt(without, newParentId, found.block, index);
}

export function updateBlockData(
  layers: Layer[],
  id: string,
  patch: Record<string, unknown>
): Layer[] {
  return updateLayerInTree(layers, id, (layer) => {
    const data =
      typeof layer.data === 'object' && layer.data !== null
        ? (layer.data as Record<string, unknown>)
        : {};
    return { ...layer, data: { ...data, ...patch } };
  });
}

export function mapPageLayers(
  scene: Scene,
  pageId: string,
  mapper: (layers: Layer[]) => Layer[]
): Scene {
  return {
    ...scene,
    pages: scene.pages.map((page) =>
      page.id === pageId ? { ...page, layers: mapper(page.layers) } : page
    ),
  };
}

export function createBlock(
  type: string,
  id: string,
  defaultData: Record<string, unknown>
): Layer {
  return {
    id,
    type,
    data: structuredClone(defaultData),
  };
}

export function getPageRootId(page: Page): string | null {
  const root = page.layers.find((layer) => layer.type === 'html.root');
  return root?.id ?? null;
}

export { getLayerChildren as getBlockChildren };
