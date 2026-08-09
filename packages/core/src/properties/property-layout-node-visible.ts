import { PropertyBlockNode } from './property-block-node';
import type { PropertyInputGroupNode } from './property-input-group-node';
import type { PropertyLayoutNode } from './property-layout-node';
import { PropertyPath } from './property-path';
import { PropertyRowNode } from './property-row-node';
import type { PropertyValuePath } from './property-value-path';

export type PropertyLayoutWhenEvaluator = (
  clause?: string,
  meta?: { nodeLabel?: string }
) => boolean;

/** Whether a layout node passes its optional `when` clause. */
export function isPropertyLayoutNodeVisible(
  node: PropertyLayoutNode,
  evaluateWhen: PropertyLayoutWhenEvaluator
): boolean {
  return evaluateWhen(node.when, {
    nodeLabel: propertyLayoutNodeLabel(node),
  });
}

function propertyLayoutNodeLabel(node: PropertyLayoutNode): string | undefined {
  if (node instanceof PropertyRowNode) {
    return node.label;
  }
  if (node instanceof PropertyBlockNode) {
    return node.label;
  }
  const group = node as PropertyInputGroupNode;
  return group.blockLabel;
}

export function propertyLayoutNodeReactKey(
  node: PropertyLayoutNode,
  layerId: string,
  siblingIndex = 0
): string {
  if (node instanceof PropertyRowNode) {
    const path = node.path ?? defaultRowPath(node.field.key);
    return `row:${layerId}:${path}`;
  }
  if (node instanceof PropertyBlockNode) {
    return `block:${layerId}:${siblingIndex}:${node.label}`;
  }
  const group = node as PropertyInputGroupNode;
  const cellPaths = group.cells.map((cell) => cell.path).join('|');
  return `inputGroup:${layerId}:${group.blockLabel}:${cellPaths}`;
}

function defaultRowPath(fieldKey: string): PropertyValuePath {
  return PropertyPath.layerData(fieldKey);
}
