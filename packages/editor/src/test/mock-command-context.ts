import type { Document } from '@openenvx/editor/schema';
import { InstantiationService, WorkbenchEventService } from '@openenvx/studio';
import type { CommandContext } from '@openenvx/studio';

import { DocumentStore } from '../scene/document-store';
import { DocumentStoreServiceId } from '../tokens';

export interface MockCommandContextOptions {
  selectedIds?: string[];
  primaryId?: string | null;
  activeArtboardId?: string;
  /** Reuse an existing store instead of creating a new one from `document`. */
  store?: DocumentStore;
  events?: CommandContext['events'];
}

export interface MockCommandContextResult {
  ctx: CommandContext;
  store: DocumentStore;
}

/** Command context with a registered {@link DocumentStoreServiceId}. */
export function createMockCommandContext(
  document: Document,
  options: MockCommandContextOptions = {}
): MockCommandContextResult {
  const store = options.store ?? new DocumentStore(document);
  if (options.activeArtboardId) {
    store.setActiveArtboard(options.activeArtboardId);
  }
  if (options.selectedIds) {
    store.selectNodes(
      options.selectedIds,
      options.primaryId ?? options.selectedIds[0] ?? null
    );
  }
  const services = new InstantiationService();
  services.registerInstance(DocumentStoreServiceId, store);
  const ctx: CommandContext = {
    services,
    events: options.events ?? new WorkbenchEventService(),
  };
  return { ctx, store };
}
