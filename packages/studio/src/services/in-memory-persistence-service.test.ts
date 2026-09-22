import { createEmptyProjectSnapshot } from '#studio/schema';
import { describe, expect, it } from 'vitest';

import { InMemoryPersistenceService } from './in-memory-persistence-service';

describe('InMemoryPersistenceService', () => {
  it('saves and loads a scene snapshot by uri', async () => {
    const service = new InMemoryPersistenceService();
    const snapshot = createEmptyProjectSnapshot();
    await service.save('doc://test', snapshot);
    const loaded = await service.load('doc://test');
    expect(loaded.session.activeArtboardId).toBe(
      snapshot.session.activeArtboardId
    );
    expect(loaded.document.artboards).toHaveLength(1);
    expect(loaded.document.artboards[0]!.nodes).toEqual([]);
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
    await service.save('doc://a', createEmptyProjectSnapshot());
    await service.save('doc://b', createEmptyProjectSnapshot());
    expect(service.has('doc://a')).toBe(true);
    expect(service.has('doc://missing')).toBe(false);
  });

  it('clears all documents', async () => {
    const service = new InMemoryPersistenceService();
    await service.save('doc://a', createEmptyProjectSnapshot());
    service.clear();
    await expect(service.load('doc://a')).rejects.toThrow(
      'Document not found: doc://a'
    );
  });
});
