import type { Document, DocumentAsset, ProjectSnapshot } from '#studio/schema';

export interface AssetService {
  resolveUrl(ref: string): string;
  upload?(file: File): Promise<string>;
  hydrate?(assets: Record<string, DocumentAsset> | undefined): void;
  exportReferenced?(document: Document): Record<string, DocumentAsset>;
}

export interface FontDescriptor {
  id: string;
  family: string;
  src?: string;
}

export interface FontService {
  list(): FontDescriptor[];
  listFeatured(): FontDescriptor[];
  resolve(family: string): FontDescriptor | null;
  register(font: FontDescriptor): void;
  ensureLoaded(family: string): Promise<void>;
}

export interface PersistenceService {
  save(uri: string, snapshot: ProjectSnapshot): Promise<void>;
  load(uri: string): Promise<ProjectSnapshot>;
  list?(): Promise<string[]> | string[];
}
