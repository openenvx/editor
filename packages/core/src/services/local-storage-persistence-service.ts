import {
  normalizeSceneSnapshot,
  type SceneSnapshot,
} from '@openenvx/core/schema';

import type { PersistenceService } from './types';

const KEY_PREFIX = 'owb:doc:';

export class LocalStoragePersistenceService implements PersistenceService {
  async save(uri: string, snapshot: SceneSnapshot): Promise<void> {
    if (typeof localStorage === 'undefined') {
      throw new TypeError('localStorage is not available');
    }
    localStorage.setItem(KEY_PREFIX + uri, JSON.stringify(snapshot));
  }

  async load(uri: string): Promise<SceneSnapshot> {
    if (typeof localStorage === 'undefined') {
      throw new TypeError('localStorage is not available');
    }
    const raw = localStorage.getItem(KEY_PREFIX + uri);
    if (raw === null) {
      throw new Error(`Document not found: ${uri}`);
    }
    return normalizeSceneSnapshot(JSON.parse(raw));
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
