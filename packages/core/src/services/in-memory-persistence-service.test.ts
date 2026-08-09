import { createEmptySceneSnapshot } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import { InMemoryPersistenceService } from './in-memory-persistence-service';

describe('InMemoryPersistenceService', () => {
  it('saves and loads a scene snapshot by uri', async () => {
    const service = new InMemoryPersistenceService();
    const snapshot = createEmptySceneSnapshot();
    await service.save('doc://test', snapshot);
    const loaded = await service.load('doc://test');
    expect(loaded.editorState.activePageId).toBe(
      snapshot.editorState.activePageId
    );
    expect(loaded.scene.schemaVersion).toBe(snapshot.scene.schemaVersion);
    expect(loaded.scene.pages).toHaveLength(1);
    expect(loaded.scene.pages[0]!.layers).toEqual([]);
    expect(loaded).not.toBe(snapshot);
  });

  it('throws when loading a missing uri', async () => {
    const service = new InMemoryPersistenceService();
    await expect(service.load('doc://missing')).rejects.toThrow(
      'Document not found: doc://missing'
    );
  });

  it('reports stored uris', async () => {
    const service = new InMemoryPersistenceService();
    await service.save('doc://a', createEmptySceneSnapshot());
    await service.save('doc://b', createEmptySceneSnapshot());
    expect(service.has('doc://a')).toBe(true);
    expect(service.has('doc://missing')).toBe(false);
  });

  it('clears all documents', async () => {
    const service = new InMemoryPersistenceService();
    await service.save('doc://a', createEmptySceneSnapshot());
    service.clear();
    await expect(service.load('doc://a')).rejects.toThrow(
      'Document not found: doc://a'
    );
  });
});
