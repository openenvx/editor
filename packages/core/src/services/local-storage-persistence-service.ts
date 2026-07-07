import { normalizeScene } from '@openenvx/schema';
import type { Scene } from '@openenvx/schema';

import type { PersistenceService } from './types';

const KEY_PREFIX = 'owb:doc:';

export class LocalStoragePersistenceService implements PersistenceService {
  async save(uri: string, scene: Scene): Promise<void> {
    if (typeof localStorage === 'undefined') {
      throw new TypeError('localStorage is not available');
    }
    localStorage.setItem(KEY_PREFIX + uri, JSON.stringify(scene));
  }

  async load(uri: string): Promise<Scene> {
    if (typeof localStorage === 'undefined') {
      throw new TypeError('localStorage is not available');
    }
    const raw = localStorage.getItem(KEY_PREFIX + uri);
    if (raw === null) {
      throw new Error(`Document not found: ${uri}`);
    }
    return normalizeScene(JSON.parse(raw));
  }

  delete(uri: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(KEY_PREFIX + uri);
  }

  list(): string[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    const uris: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(KEY_PREFIX)) {
        uris.push(key.slice(KEY_PREFIX.length));
      }
    }
    return uris;
  }
}
