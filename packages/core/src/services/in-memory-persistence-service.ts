import {
  normalizeSceneSnapshot,
  type SceneSnapshot,
} from '@openenvx/core/schema';

import type { PersistenceService } from './types';

export class InMemoryPersistenceService implements PersistenceService {
  private readonly documents = new Map<string, SceneSnapshot>();

  async save(uri: string, snapshot: SceneSnapshot): Promise<void> {
    this.documents.set(uri, structuredClone(snapshot));
  }

  async load(uri: string): Promise<SceneSnapshot> {
    const snapshot = this.documents.get(uri);
    if (!snapshot) {
      throw new Error(`Document not found: ${uri}`);
    }
    return normalizeSceneSnapshot(structuredClone(snapshot));
  }

  clear(): void {
    this.documents.clear();
  }

  has(uri: string): boolean {
    return this.documents.has(uri);
  }
}
