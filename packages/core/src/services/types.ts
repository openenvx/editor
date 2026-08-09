import type { SceneSnapshot as PersistedSceneSnapshot } from '@openenvx/core/schema';

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
  /** Optional remote face URL (custom / registerFont). */
  src?: string;
}

export interface FontService {
  list(): FontDescriptor[];
  /** Short list for the picker before search (provider-defined). */
  listFeatured(): FontDescriptor[];
  resolve(family: string): FontDescriptor | null;
  register(font: FontDescriptor): void;
  /** Ensure faces for `family` are available to `document.fonts` (no-op for system fonts). */
  ensureLoaded(family: string): Promise<void>;
}

export interface PersistenceService {
  save(uri: string, snapshot: PersistedSceneSnapshot): Promise<void>;
  load(uri: string): Promise<PersistedSceneSnapshot>;
  list?(): Promise<string[]> | string[];
}
