import type { DocumentNode } from '@openenvx/editor/schema';

function walkNodes(
  nodes: DocumentNode[],
  visitor: (node: DocumentNode, path: DocumentNode[]) => void,
  path: DocumentNode[] = []
): void {
  for (const node of nodes) {
    visitor(node, path);
    const children = node.children;
    if (children?.length) {
      walkNodes(children, visitor, [...path, node]);
    }
  }
}

export function getNodeAncestorIds(
  page: { nodes: DocumentNode[] },
  layerId: string
): string[] {
  let ancestorIds: string[] = [];
  walkNodes(page.nodes, (node, path) => {
    if (node.id === layerId) {
      ancestorIds = path.map((ancestor) => ancestor.id);
    }
  });
  return ancestorIds;
}
