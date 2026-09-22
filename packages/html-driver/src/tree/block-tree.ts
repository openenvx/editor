import {
  findLayerLocation,
  getLayerChildren,
  insertLayerIntoContainer,
  isLayerDescendant,
  removeLayerFromTree,
  updateLayerInTree,
} from '@openenvx/studio/core';
import type { Artboard, Document, DocumentNode } from '@openenvx/studio/schema';
import { nodeProps } from '@openenvx/studio/schema';

export type Layer = DocumentNode;
export type Page = Artboard;
export type Scene = Document;

export function findBlock(
  layers: Layer[],
  id: string
): { block: Layer; parentId: string | null; index: number } | null {
  const loc = findLayerLocation(layers, id);
  if (!loc) {
    return null;
  }
  const block = loc.parentNodes[loc.index];
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
  return updateLayerInTree(layers, id, (layer) => ({
    ...layer,
    props: { ...nodeProps(layer), ...patch },
  }));
}

export function mapPageLayers(
  scene: Scene,
  pageId: string,
  mapper: (layers: Layer[]) => Layer[]
): Scene {
  return {
    ...scene,
    artboards: scene.artboards.map((page) =>
      page.id === pageId ? { ...page, nodes: mapper(page.nodes) } : page
    ),
  };
}

function normalizeLegacyBlockNode(raw: unknown): Layer {
  if (!raw || typeof raw !== 'object') {
    return { id: 'invalid', type: 'html.text', props: {} };
  }
  const record = raw as Record<string, unknown>;
  const props = structuredClone(
    (record.props ?? record.data ?? {}) as Record<string, unknown>
  );
  let children: Layer[] | undefined;
  if (Array.isArray(record.children)) {
    children = record.children.map((child) => normalizeLegacyBlockNode(child));
  } else if (Array.isArray(props.children)) {
    children = (props.children as unknown[]).map((child) =>
      normalizeLegacyBlockNode(child)
    );
    delete props.children;
  }
  return {
    id: String(record.id ?? 'tmp'),
    type: String(record.type ?? 'html.text'),
    props,
    ...(children ? { children } : {}),
  };
}

export function createBlock(
  type: string,
  id: string,
  defaultData: Record<string, unknown>
): Layer {
  const props = structuredClone(defaultData);
  let children: Layer[] | undefined;
  if (Array.isArray(props.children)) {
    children = (props.children as unknown[]).map((child) =>
      normalizeLegacyBlockNode(child)
    );
    delete props.children;
  }
  const cloned = cloneBlockWithNewIds(
    {
      id: 'tmp',
      type,
      props,
      ...(children ? { children } : {}),
    },
    createPartId
  );
  return { ...cloned, id };
}

function createPartId(type: string): string {
  return `${type.replaceAll('.', '-')}-${crypto.randomUUID()}`;
}

function clonePropsTree(
  block: Layer,
  createId: (type: string) => string
): { props: Record<string, unknown>; children?: Layer[] } {
  const props = structuredClone(nodeProps(block));
  let children: Layer[] | undefined;
  if (Array.isArray(block.children)) {
    children = block.children.map((child) =>
      cloneBlockWithNewIds(child, createId)
    );
    delete props.children;
  }
  if (props.slots && typeof props.slots === 'object' && props.slots !== null) {
    const nextSlots: Record<string, Layer[]> = {};
    for (const [key, parts] of Object.entries(
      props.slots as Record<string, unknown>
    )) {
      if (!Array.isArray(parts)) {
        continue;
      }
      nextSlots[key] = parts.map((part) => {
        if (!part || typeof part !== 'object') {
          return part as Layer;
        }
        return cloneBlockWithNewIds(part as Layer, createId);
      });
    }
    props.slots = nextSlots;
  }
  return { props, ...(children ? { children } : {}) };
}

/** Deep-clone a block subtree with fresh ids (nested `children` and `props.slots`). */
export function cloneBlockWithNewIds(
  block: Layer,
  createId: (type: string) => string
): Layer {
  const source =
    block.props !== undefined ? block : normalizeLegacyBlockNode(block);
  const { props, children } = clonePropsTree(source, createId);
  return {
    ...block,
    id: createId(block.type),
    props,
    ...(children ? { children } : {}),
  };
}

export function getPageRootId(
  page: Page,
  rootType = 'html.root'
): string | null {
  const preferred = page.nodes.find((layer) => layer.type === rootType);
  if (preferred) {
    return preferred.id;
  }
  const anyRoot = page.nodes.find((layer) => layer.type.endsWith('.root'));
  return anyRoot?.id ?? null;
}

export function siblingCount(layers: Layer[], parentId: string | null): number {
  if (parentId === null) {
    return layers.length;
  }
  const parent = findBlock(layers, parentId);
  if (!parent) {
    return 0;
  }
  return getLayerChildren(parent.block).length;
}

export { getLayerChildren as getBlockChildren };
