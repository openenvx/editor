import type {
  Document,
  DocumentNode,
  FrozenNodeSnapshot,
  NodeWriteMode,
} from '#studio/schema';

import { nodeProps, nodeTransform } from '../schema/node-helpers';
import { getNodeChildren, hasChildNodesInTree, walkNodes } from './layer-tree';

let templatePolicyEnforced = true;

export function setTemplatePolicyEnforced(enforced: boolean): void {
  templatePolicyEnforced = enforced;
}

export function isTemplatePolicyEnforced(): boolean {
  return templatePolicyEnforced;
}

export function getNodeWriteMode(node: DocumentNode): NodeWriteMode {
  return node.writeMode ?? 'free';
}

export const getLayerWriteMode = getNodeWriteMode;

export function isNodeShownInLayers(node: DocumentNode): boolean {
  return node.showInLayers !== false;
}

export const isLayerShownInLayers = isNodeShownInLayers;

export function isNodeEditable(node: DocumentNode): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return getNodeWriteMode(node) !== 'locked';
}

export const isLayerEditable = isNodeEditable;

export function isNodeLocked(node: DocumentNode): boolean {
  return node.locked === true;
}

export const isLayerLocked = isNodeLocked;

export function isNodeVisible(node: DocumentNode): boolean {
  return node.visible !== false;
}

export const isLayerVisible = isNodeVisible;

export function isNodeWritable(node: DocumentNode): boolean {
  return isNodeEditable(node) && !isNodeLocked(node);
}

export const isLayerWritable = isNodeWritable;

export function canSelectNode(node: DocumentNode): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  if (!isNodeShownInLayers(node)) {
    return getNodeWriteMode(node) === 'content';
  }
  return getNodeWriteMode(node) !== 'locked';
}

export const canSelectLayer = canSelectNode;

export function canTransformNode(node: DocumentNode): boolean {
  if (!isNodeWritable(node)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  const mode = getNodeWriteMode(node);
  return mode === 'free' || mode === 'properties';
}

export const canTransformLayer = canTransformNode;

export function canEditNodeProps(node: DocumentNode, key?: string): boolean {
  if (!isNodeWritable(node)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  const mode = getNodeWriteMode(node);
  if (mode === 'free') {
    return true;
  }
  if (mode !== 'content') {
    return false;
  }
  const allowed = node.allowedPropKeys;
  if (!allowed || allowed.length === 0) {
    return true;
  }
  if (key === undefined) {
    return true;
  }
  return allowed.includes(key);
}

export const canEditLayerData = canEditNodeProps;

export function isLayoutRootNode(node: DocumentNode): boolean {
  return node.type.endsWith('.root');
}

export const isLayoutRootLayer = isLayoutRootNode;

export function canDeleteNode(node: DocumentNode, document: Document): boolean {
  if (isLayoutRootNode(node)) {
    return false;
  }
  if (!canTransformNode(node)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return document.templatePolicy?.allowDeleteLayers !== false;
}

export const canDeleteLayer = canDeleteNode;

export function canDuplicateNode(
  node: DocumentNode,
  document: Document
): boolean {
  if (!canTransformNode(node)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return document.templatePolicy?.allowDuplicateLayers !== false;
}

export const canDuplicateLayer = canDuplicateNode;

export function canReorderNode(node: DocumentNode): boolean {
  return canTransformNode(node);
}

export const canReorderLayer = canReorderNode;

export function canInsertNodes(document: Document): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return document.templatePolicy?.allowInsertLayers !== false;
}

export const canInsertLayers = canInsertNodes;

export function canResizeArtboard(document: Document): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return document.templatePolicy?.allowArtboardResize !== false;
}

export const canResizePage = canResizeArtboard;

export function buildFrozenNodeSnapshot(
  document: Document
): Record<string, FrozenNodeSnapshot> {
  const frozen: Record<string, FrozenNodeSnapshot> = {};

  for (const artboard of document.artboards) {
    walkNodes(artboard.nodes, (node) => {
      const mode = getNodeWriteMode(node);
      const frame = nodeTransform(node);

      if (mode === 'locked') {
        frozen[node.id] = {
          props: structuredClone(nodeProps(node)),
          frame: structuredClone(frame),
        };
        return;
      }

      if (mode === 'content') {
        frozen[node.id] = { frame: structuredClone(frame) };
        return;
      }

      if (mode === 'properties') {
        frozen[node.id] = {
          props: structuredClone(nodeProps(node)),
        };
      }
    });
  }

  return frozen;
}

export const buildFrozenLayerSnapshot = buildFrozenNodeSnapshot;

export function withFrozenNodeSnapshots(document: Document): Document {
  const policy = document.templatePolicy;
  return {
    ...document,
    templatePolicy: {
      allowDeleteLayers: policy?.allowDeleteLayers ?? true,
      allowDuplicateLayers: policy?.allowDuplicateLayers ?? true,
      allowInsertLayers: policy?.allowInsertLayers ?? true,
      allowArtboardResize: policy?.allowArtboardResize ?? true,
      version: 1,
      ...policy,
      frozenNodes: buildFrozenNodeSnapshot(document),
    },
  };
}

export const withFrozenLayerSnapshots = withFrozenNodeSnapshots;

function restoreFrozenNode(
  node: DocumentNode,
  frozen: Record<string, FrozenNodeSnapshot>
): DocumentNode {
  const snap = frozen[node.id];
  let next = node;
  if (snap) {
    next = { ...next };
    if (snap.props !== undefined) {
      next = {
        ...next,
        props: structuredClone(snap.props) as Record<string, unknown>,
      };
    }
    if (snap.frame !== undefined) {
      next = { ...next, frame: structuredClone(snap.frame) };
    }
  }
  if (!hasChildNodesInTree(next)) {
    return next;
  }
  return {
    ...next,
    children: getNodeChildren(next).map((child) =>
      restoreFrozenNode(child, frozen)
    ),
  };
}

export function applyFrozenNodePolicy(document: Document): Document {
  if (!isTemplatePolicyEnforced()) {
    return document;
  }
  const frozen = document.templatePolicy?.frozenNodes;
  if (!frozen || Object.keys(frozen).length === 0) {
    return document;
  }
  return {
    ...document,
    artboards: document.artboards.map((artboard) => ({
      ...artboard,
      nodes: artboard.nodes.map((node) => restoreFrozenNode(node, frozen)),
    })),
  };
}

export const applyFrozenLayerPolicy = applyFrozenNodePolicy;
