import { createEmptyScene } from '@openenvx/schema';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalStoragePersistenceService } from './local-storage-persistence-service';

describe('LocalStoragePersistenceService', () => {
  let service: LocalStoragePersistenceService;
  let store: Record<string, string> = {};
  let originalLocalStorage: unknown;

  beforeEach(() => {
    store = {};
    originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      clear: () => {
        store = {};
      },
      getItem: (key: string) => store[key] ?? null,
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    };
    service = new LocalStoragePersistenceService();
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it('saves and loads a scene by uri', async () => {
    const scene = createEmptyScene();
    await service.save('doc://test', scene);
    const loaded = await service.load('doc://test');
    expect(loaded.activePageId).toBe(scene.activePageId);
    expect(loaded.schemaVersion).toBe(scene.schemaVersion);
  });

  it('throws when loading a missing uri', async () => {
    await expect(service.load('doc://missing')).rejects.toThrow(
      'Document not found: doc://missing'
    );
  });

  it('deletes and lists documents', async () => {
    await service.save('doc://a', createEmptyScene());
    await service.save('doc://b', createEmptyScene());
    expect(service.list()).toEqual(['doc://a', 'doc://b']);
    service.delete('doc://a');
    expect(service.list()).toEqual(['doc://b']);
  });

  it('saves and loads a scene with assets', async () => {
    const scene = {
      ...createEmptyScene(),
      assets: {
        img1: { data: 'eHk=', encoding: 'base64' as const, mimeType: 'image/png' },
      },
      pages: [
        {
          ...createEmptyScene().pages[0]!,
          layers: [
            {
              data: { assetRef: 'asset://img1' },
              id: '1',
              type: 'image',
            },
          ],
        },
      ],
    };
    await service.save('doc://assets', scene);
    const loaded = await service.load('doc://assets');
    expect(loaded.assets).toEqual({
      img1: { data: 'eHk=', encoding: 'base64', mimeType: 'image/png' },
    });
    expect(loaded.pages[0]!.layers[0]!.data).toEqual({
      assetRef: 'asset://img1',
    });
  });
});
