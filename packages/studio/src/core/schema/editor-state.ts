import { nodeExistsOnArtboard } from '../scene/layer-tree';
import type { Document, EditorSession } from './types';

/** Drop selection references to nodes/artboards that no longer exist. */
export function pruneEditorSession(
  document: Document,
  session: EditorSession
): EditorSession {
  const fallbackArtboardId = document.artboards[0]?.id;
  if (!fallbackArtboardId) {
    return session;
  }

  const activeArtboardId = document.artboards.some(
    (a) => a.id === session.activeArtboardId
  )
    ? session.activeArtboardId
    : fallbackArtboardId;
  const artboard = document.artboards.find((a) => a.id === activeArtboardId)!;
  const selectedNodeIds = session.selectedNodeIds.filter((id) =>
    nodeExistsOnArtboard(artboard, id)
  );
  const primaryNodeId =
    session.primaryNodeId && selectedNodeIds.includes(session.primaryNodeId)
      ? session.primaryNodeId
      : (selectedNodeIds[0] ?? null);

  return { activeArtboardId, primaryNodeId, selectedNodeIds };
}

/** @deprecated use pruneEditorSession */
export function pruneEditorState(
  document: Document,
  session: EditorSession
): EditorSession {
  return pruneEditorSession(document, session);
}
