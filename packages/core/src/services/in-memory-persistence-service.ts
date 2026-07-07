import { normalizeScene } from '@openenvx/schema';
import type { Scene } from '@openenvx/schema';

import type { PersistenceService } from './types';

export class InMemoryPersistenceService implements PersistenceService {
  private readonly documents = new Map<string, Scene>();

  async save(uri: string, scene: Scene): Promise<void> {
    this.documents.set(uri, structuredClone(scene));
  }

  async load(uri: string): Promise<Scene> {
    const scene = this.documents.get(uri);
    if (!scene) {
      throw new Error(`Document not found: ${uri}`);
    }
    return normalizeScene(structuredClone(scene));
  }

  clear(): void {
    this.documents.clear();
  }

  has(uri: string): boolean {
    return this.documents.has(uri);
  }
}
