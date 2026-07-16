import type { SceneSnapshot as PersistedSceneSnapshot } from '@openenvx/schema';

import type { Scene, SceneAsset } from '../scene/types';

export interface AssetService {
  resolveUrl(ref: string): string;
  upload?(file: File): Promise<string>;
  hydrate?(assets: Record<string, SceneAsset> | undefined): void;
  exportReferenced?(scene: Scene): Record<string, SceneAsset>;
}

export interface FontDescriptor {
  id: string;
  family: string;
  src?: string;
}

export interface FontService {
  list(): FontDescriptor[];
  resolve(family: string): FontDescriptor | null;
}

export interface PersistenceService {
  save(uri: string, snapshot: PersistedSceneSnapshot): Promise<void>;
  load(uri: string): Promise<PersistedSceneSnapshot>;
  list?(): Promise<string[]> | string[];
}
