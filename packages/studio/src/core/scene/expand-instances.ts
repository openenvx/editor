import type {
  CanvasInstanceProps,
  Document,
  DocumentComponent,
  DocumentNode,
} from '@openenvx/studio/schema';

import { nodeProps } from '../schema/node-helpers';
import { getNodeChildren, hasChildNodesInTree } from './layer-tree';

export const CANVAS_INSTANCE_LAYER_TYPE = 'canvas.instance';

export const INSTANCE_SURFACE_CHILD_SEP = '::';

export function buildInstanceSurfaceLayerId(
  instanceNodeId: string,
  definitionNodeId: string
): string {
  return `${instanceNodeId}${INSTANCE_SURFACE_CHILD_SEP}${definitionNodeId}`;
}

function remapNodeForInstanceSurface(
  instanceNodeId: string,
  node: DocumentNode
): DocumentNode {
  const id = buildInstanceSurfaceLayerId(instanceNodeId, node.id);
  const surfaceNode: DocumentNode = {
    ...node,
    id,
    locked: true,
    writeMode: 'locked',
  };
  if (!hasChildNodesInTree(node)) {
    return surfaceNode;
  }
  return {
    ...surfaceNode,
    children: getNodeChildren(node).map((child) =>
      remapNodeForInstanceSurface(instanceNodeId, child)
    ),
  };
}

function remapNodesForInstanceSurface(
  instanceNodeId: string,
  nodes: DocumentNode[]
): DocumentNode[] {
  return nodes.map((node) => remapNodeForInstanceSurface(instanceNodeId, node));
}

export function isCanvasInstanceNode(node: DocumentNode): boolean {
  return node.type === CANVAS_INSTANCE_LAYER_TYPE;
}

/** @deprecated use isCanvasInstanceNode */
export const isCanvasInstanceLayer = isCanvasInstanceNode;

export function getInstanceComponentId(node: DocumentNode): string | null {
  if (!isCanvasInstanceNode(node)) {
    return null;
  }
  const props = nodeProps(node) as unknown as CanvasInstanceProps;
  const componentId = props.componentId;
  return typeof componentId === 'string' && componentId ? componentId : null;
}

export function resolveInstanceDefinitionNodes(
  node: DocumentNode,
  components: Record<string, DocumentComponent> | undefined
): DocumentNode[] {
  const componentId = getInstanceComponentId(node);
  if (!componentId) {
    return [];
  }
  const definition = components?.[componentId];
  if (!definition) {
    return [];
  }
  const props = nodeProps(node) as unknown as CanvasInstanceProps;
  const overrides = props.overrides;
  if (!overrides) {
    return definition.nodes;
  }
  return definition.nodes.map((child) => {
    const patch = overrides[child.id];
    if (!patch) {
      return child;
    }
    return {
      ...child,
      props: {
        ...nodeProps(child),
        ...patch,
      },
    };
  });
}

/** @deprecated use resolveInstanceDefinitionNodes */
export const resolveInstanceDefinitionLayers = resolveInstanceDefinitionNodes;

export function getNodeChildrenForDocument(
  node: DocumentNode,
  document: Document
): DocumentNode[] {
  if (isCanvasInstanceNode(node)) {
    const definitionNodes = resolveInstanceDefinitionNodes(
      node,
      document.components
    );
    return remapNodesForInstanceSurface(node.id, definitionNodes);
  }
  return getNodeChildren(node);
}

/** @deprecated use getNodeChildrenForDocument */
export const getLayerChildrenForScene = getNodeChildrenForDocument;
