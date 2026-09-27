import { getChildNodes, hasChildNodes } from '../schema/node-helpers';
import type { Artboard, Document, DocumentNode } from '../schema/types';

export { getChildNodes, hasChildNodes };

export const getNodeChildren = getChildNodes;

export function hasChildNodesInTree(node: DocumentNode): boolean {
  return hasChildNodes(node);
}

export const CONTAINER_LAYER_TYPE = 'container';

export interface ContainerLayoutModel {
  layout: 'row' | 'column';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between';
  children: DocumentNode[];
}

export function isContainerNode(node: DocumentNode): boolean {
  return node.type === CONTAINER_LAYER_TYPE;
}

export function getContainerChildren(node: DocumentNode): DocumentNode[] {
  if (!isContainerNode(node)) {
    return [];
  }
  return getChildNodes(node);
}

export function mapNodeChildren(
  node: DocumentNode,
  mapper: (nodes: DocumentNode[]) => DocumentNode[]
): DocumentNode {
  if (!hasChildNodes(node)) {
    return node;
  }
  return {
    ...node,
    children: mapper(getChildNodes(node)),
  };
}

export function walkNodes(
  nodes: DocumentNode[],
  visitor: (node: DocumentNode, path: DocumentNode[]) => void,
  path: DocumentNode[] = []
): void {
  for (const node of nodes) {
    visitor(node, path);
    if (hasChildNodes(node)) {
      walkNodes(getChildNodes(node), visitor, [...path, node]);
    }
  }
}

export function findNodeById(
  document: Document,
  nodeId: string
): DocumentNode | null {
  for (const artboard of document.artboards) {
    let found: DocumentNode | null = null;
    walkNodes(artboard.nodes, (node) => {
      if (node.id === nodeId) {
        found = node;
      }
    });
    if (found) {
      return found;
    }
  }
  return null;
}

export function findNodeArtboard(
  document: Document,
  nodeId: string
): Artboard | null {
  for (const artboard of document.artboards) {
    let found = false;
    walkNodes(artboard.nodes, (node) => {
      if (node.id === nodeId) {
        found = true;
      }
    });
    if (found) {
      return artboard;
    }
  }
  return null;
}

export function nodeExistsOnArtboard(
  artboard: Artboard,
  nodeId: string
): boolean {
  let exists = false;
  walkNodes(artboard.nodes, (node) => {
    if (node.id === nodeId) {
      exists = true;
    }
  });
  return exists;
}

export function mapNodes(
  nodes: DocumentNode[],
  mapper: (node: DocumentNode) => DocumentNode
): DocumentNode[] {
  return nodes.map((node) => {
    const next = mapper(node);
    return mapNodeChildren(next, (children) => mapNodes(children, mapper));
  });
}

export function createNodeId(type: string): string {
  const stem = type.replace(/^canvas\./, '') || 'node';
  return `${stem}-${crypto.randomUUID()}`;
}

export function cloneNodeTree(nodes: DocumentNode[]): DocumentNode[] {
  return nodes.map((node) => {
    const cloned = structuredClone(node);
    cloned.id = createNodeId(node.type);
    if (hasChildNodes(cloned)) {
      cloned.children = cloneNodeTree(getChildNodes(cloned));
    }
    return cloned;
  });
}

export function updateNodeInTree(
  nodes: DocumentNode[],
  nodeId: string,
  updater: (node: DocumentNode) => DocumentNode
): DocumentNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }
    return mapNodeChildren(node, (children) =>
      updateNodeInTree(children, nodeId, updater)
    );
  });
}

export function updateNodeByIdInDocument(
  document: Document,
  nodeId: string,
  updater: (node: DocumentNode) => DocumentNode
): Document {
  const mapTree = (nodes: DocumentNode[]) =>
    updateNodeInTree(nodes, nodeId, updater);
  return {
    ...document,
    artboards: document.artboards.map((artboard) => ({
      ...artboard,
      nodes: mapTree(artboard.nodes),
    })),
    components: document.components
      ? Object.fromEntries(
          Object.entries(document.components).map(([id, component]) => [
            id,
            { ...component, nodes: mapTree(component.nodes) },
          ])
        )
      : document.components,
  };
}

export function removeNodeFromTree(
  nodes: DocumentNode[],
  nodeId: string
): DocumentNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) =>
      mapNodeChildren(node, (children) => removeNodeFromTree(children, nodeId))
    );
}

export function insertNodeIntoContainer(
  nodes: DocumentNode[],
  containerId: string,
  child: DocumentNode,
  index?: number
): DocumentNode[] {
  return nodes.map((node) => {
    if (node.id === containerId && hasChildNodes(node)) {
      const children = [...getChildNodes(node)];
      const at = index ?? children.length;
      children.splice(at, 0, child);
      return {
        ...node,
        children,
      };
    }
    return mapNodeChildren(node, (children) =>
      insertNodeIntoContainer(children, containerId, child, index)
    );
  });
}

export function moveNodeInTree(
  nodes: DocumentNode[],
  nodeId: string,
  targetIndex: number,
  parentContainerId?: string | null
): DocumentNode[] {
  let moving: DocumentNode | null = null;
  walkNodes(nodes, (node) => {
    if (node.id === nodeId) {
      moving = node;
    }
  });
  if (!moving) {
    return nodes;
  }

  const without = removeNodeFromTree(nodes, nodeId);

  if (parentContainerId) {
    return insertNodeIntoContainer(
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

interface NodeLocation {
  parentNodes: DocumentNode[];
  index: number;
  containerId: string | null;
}

export function findNodeLocation(
  nodes: DocumentNode[],
  nodeId: string,
  containerId: string | null = null
): NodeLocation | null {
  const index = nodes.findIndex((node) => node.id === nodeId);
  if (index !== -1) {
    return { containerId, index, parentNodes: nodes };
  }
  for (const node of nodes) {
    if (hasChildNodes(node)) {
      const children = getChildNodes(node);
      const nested = findNodeLocation(children, nodeId, node.id);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function moveNodeRelativeToTarget(
  nodes: DocumentNode[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside'
): DocumentNode[] {
  let moving: DocumentNode | null = null;
  walkNodes(nodes, (node) => {
    if (node.id === sourceId) {
      moving = node;
    }
  });
  if (!moving || sourceId === targetId) {
    return nodes;
  }

  const without = removeNodeFromTree(nodes, sourceId);

  if (position === 'inside') {
    return insertNodeIntoContainer(without, targetId, moving);
  }

  const targetLoc = findNodeLocation(without, targetId);
  if (!targetLoc) {
    return nodes;
  }

  const insertIndex =
    position === 'before' ? targetLoc.index : targetLoc.index + 1;

  if (targetLoc.containerId) {
    return updateNodeInTree(without, targetLoc.containerId, (container) => {
      const children = [...getChildNodes(container)];
      children.splice(insertIndex, 0, moving!);
      return {
        ...container,
        children,
      };
    });
  }

  const roots = [...without];
  roots.splice(insertIndex, 0, moving);
  return roots;
}

export function getNodeAncestorIds(
  artboard: Artboard,
  nodeId: string
): string[] {
  let ancestorIds: string[] = [];
  walkNodes(artboard.nodes, (node, path) => {
    if (node.id === nodeId) {
      ancestorIds = path.map((ancestor) => ancestor.id);
    }
  });
  return ancestorIds;
}

export function isNodeDescendant(
  nodes: DocumentNode[],
  ancestorId: string,
  candidateId: string
): boolean {
  if (ancestorId === candidateId) {
    return false;
  }

  let descendant = false;
  walkNodes(nodes, (node, path) => {
    if (
      node.id === candidateId &&
      path.some((ancestor) => ancestor.id === ancestorId)
    ) {
      descendant = true;
    }
  });
  return descendant;
}
