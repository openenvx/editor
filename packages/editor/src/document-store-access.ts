import type { CommandContext } from '@openenvx/studio';

import type { DocumentStore } from './scene/document-store';
import { DocumentStoreServiceId } from './tokens';

export function getDocumentStore(
  ctx: CommandContext
): DocumentStore | undefined {
  return ctx.services.get(DocumentStoreServiceId);
}

export function requireDocumentStore(ctx: CommandContext): DocumentStore {
  const store = getDocumentStore(ctx);
  if (!store) {
    throw new Error('DocumentStore is not registered');
  }
  return store;
}
