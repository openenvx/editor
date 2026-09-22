import { normalizeProjectSnapshot, type ProjectSnapshot } from '#studio/schema';

import type { PersistenceService } from './types';

export class InMemoryPersistenceService implements PersistenceService {
  private readonly documents = new Map<string, ProjectSnapshot>();

  async save(uri: string, snapshot: ProjectSnapshot): Promise<void> {
    this.documents.set(uri, structuredClone(snapshot));
  }

  async load(uri: string): Promise<ProjectSnapshot> {
    const snapshot = this.documents.get(uri);
    if (!snapshot) {
      throw new Error(`Document not found: ${uri}`);
    }
    return normalizeProjectSnapshot(structuredClone(snapshot));
  }

  clear(): void {
    this.documents.clear();
  }

  has(uri: string): boolean {
    return this.documents.has(uri);
  }
}
