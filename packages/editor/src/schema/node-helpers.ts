import type { DocumentNode, Frame, Transform } from './types';

export function defaultFrame(): Frame {
  return {
    height: 100,
    rotation: 0,
    width: 200,
    x: 0,
    y: 0,
  };
}

export function nodeTransform(node: DocumentNode): Transform {
  const frame = node.frame ?? defaultFrame();
  return {
    ...frame,
    opacity: node.opacity ?? 1,
    scaleX: node.scaleX ?? 1,
    scaleY: node.scaleY ?? 1,
  };
}

export function applyNodeTransform(
  node: DocumentNode,
  transform: Transform
): DocumentNode {
  const { opacity, scaleX, scaleY, ...frame } = transform;
  return {
    ...node,
    frame,
    opacity,
    scaleX,
    scaleY,
  };
}

export function nodeProps(node: DocumentNode): Record<string, unknown> {
  return node.props ?? {};
}

export function defaultTransform(partial: Partial<Transform> = {}): Transform {
  return {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    ...defaultFrame(),
    ...partial,
  };
}

export function hasChildNodes(node: DocumentNode): boolean {
  return Array.isArray(node.children);
}

export function getChildNodes(node: DocumentNode): DocumentNode[] {
  return node.children ?? [];
}
