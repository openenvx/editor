import type {
  Artboard,
  Document,
  DocumentNode,
  EditorSession,
} from '@openenvx/studio/schema';

import { walkNodes } from './layer-tree';

export type {
  Artboard,
  Document,
  DocumentAsset,
  DocumentNode,
  EditorPaneKind,
  EditorSession,
  EditorSurfaceKind,
  Frame,
  Transform,
} from '@openenvx/studio/schema';

export type Page = Artboard;
export type Scene = Document;
export type Layer = DocumentNode;
export type EditorState = EditorSession;
export type Selection = EditorSession;

/**
 * Document + editor snapshot for the live store.
 *
 * - `DocumentStore.getSnapshot()` - deep clone (persistence / export).
 * - `onDidChangeDocument` / history - **shared** refs; treat as immutable.
 */
export interface LiveProjectSnapshot {
  document: Document;
  session: EditorSession;
  contentRevision: number;
}

export type SceneSnapshot = LiveProjectSnapshot;

export interface DocumentTransaction {
  label: string;
  apply(document: Document): Document;
  activeArtboardId?: string;
}

export type SceneTransaction = DocumentTransaction;

export function cloneDocument(document: Document): Document {
  return structuredClone(document);
}

export const cloneScene = cloneDocument;

export function cloneEditorSession(session: EditorSession): EditorSession {
  return structuredClone(session);
}

export const cloneEditorState = cloneEditorSession;

export function getActiveArtboard(
  document: Document,
  activeArtboardId?: string
): Artboard {
  if (activeArtboardId) {
    return (
      document.artboards.find((a) => a.id === activeArtboardId) ??
      document.artboards[0]!
    );
  }
  return document.artboards[0]!;
}

export const getActivePage = getActiveArtboard;

export function getPrimaryNode(
  document: Document,
  session: EditorSession
): DocumentNode | null {
  const artboard = getActiveArtboard(document, session.activeArtboardId);
  const { primaryNodeId } = session;
  if (!primaryNodeId) {
    return null;
  }
  const root = artboard.nodes.find((n) => n.id === primaryNodeId);
  if (root) {
    return root;
  }
  let found: DocumentNode | null = null;
  walkNodes(artboard.nodes, (node) => {
    if (node.id === primaryNodeId) {
      found = node;
    }
  });
  return found;
}

export const getPrimaryLayer = getPrimaryNode;

/** Host resolves editor surface from product configuration, not document JSON. */
export function resolveEditorSurfaceKind(_surfaceKind: string): string {
  return _surfaceKind;
}

export type PageLayout = string;

export function resolveEditorPaneKind(
  document: Document,
  activeArtboardId: string
): string {
  return (
    (getActiveArtboard(document, activeArtboardId).extensions?.layout as
      | string
      | undefined) ?? 'absolute'
  );
}
