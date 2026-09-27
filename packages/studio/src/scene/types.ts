import type {
  Artboard,
  Document,
  DocumentNode,
  EditorSession,
} from '#studio/schema';

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
} from '#studio/schema';

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

export interface DocumentTransaction {
  label: string;
  apply(document: Document): Document;
  activeArtboardId?: string;
}

export function cloneDocument(document: Document): Document {
  return structuredClone(document);
}

export function cloneEditorSession(session: EditorSession): EditorSession {
  return structuredClone(session);
}

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

/** Host resolves editor surface from product configuration, not document JSON. */
export function resolveEditorSurfaceKind(_surfaceKind: string): string {
  return _surfaceKind;
}

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
