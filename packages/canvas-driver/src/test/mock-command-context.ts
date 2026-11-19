import { DocumentStore } from '@openenvx/editor';
import { createMockCommandContext } from '@openenvx/editor/test/mock-command-context';
import type { CommandContext } from '@openenvx/studio';

export function createCanvasCommandContextFromStore(
  store: DocumentStore
): CommandContext {
  const session = store.getSession();
  return createMockCommandContext(store.getDocument(), {
    store,
    activeArtboardId: session.activeArtboardId,
    selectedIds: [...session.selectedNodeIds],
    primaryId: session.primaryNodeId,
  }).ctx;
}
