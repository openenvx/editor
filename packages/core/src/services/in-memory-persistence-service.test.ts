import { createEmptyScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { InMemoryPersistenceService } from './in-memory-persistence-service';

describe('InMemoryPersistenceService', () => {
  it('saves and loads a scene by uri', async () => {
    const service = new InMemoryPersistenceService();
    const scene = createEmptyScene();
    await service.save('doc://test', scene);
    const loaded = await service.load('doc://test');
    expect(loaded.activePageId).toBe(scene.activePageId);
    expect(loaded.schemaVersion).toBe(scene.schemaVersion);
    expect(loaded.pages).toHaveLength(1);
    expect(loaded.pages[0]!.layers).toEqual([]);
    expect(loaded).not.toBe(scene);
  });

  it('throws when loading a missing uri', async () => {
    const service = new InMemoryPersistenceService();
    await expect(service.load('doc://missing')).rejects.toThrow(
      'Document not found: doc://missing'
    );
  });

  it('reports stored uris', async () => {
    const service = new InMemoryPersistenceService();
    await service.save('doc://a', createEmptyScene());
    await service.save('doc://b', createEmptyScene());
    expect(service.has('doc://a')).toBe(true);
    expect(service.has('doc://missing')).toBe(false);
  });

  it('clears all documents', async () => {
    const service = new InMemoryPersistenceService();
    await service.save('doc://a', createEmptyScene());
    service.clear();
    await expect(service.load('doc://a')).rejects.toThrow(
      'Document not found: doc://a'
    );
  });
});
