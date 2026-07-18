import type { SceneSnapshot } from '@openenvx/schema';

/** Author metadata shown next to a version entry. */
export interface VersionAuthor {
  id?: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Version list entry metadata (no scene payload).
 * Hosts return these from {@link VersionHistoryProvider.listVersions};
 * the workbench panel loads full snapshots on demand via {@link VersionHistoryProvider.loadVersion}.
 */
export interface DocumentVersion {
  id: string;
  /** Optional user-facing name for a named checkpoint. */
  label?: string;
  /** Epoch milliseconds. */
  createdAt: number;
  author?: VersionAuthor;
  /** When true, the panel may group this entry under an autosave section. */
  isAutosave?: boolean;
}

/**
 * Host-supplied data source for document version history.
 * Register via `new VersionHistoryPlugin({ provider })` (workbench) or
 * `ctx.services.registerInstance(VersionHistoryProviderId, provider)`.
 */
export interface VersionHistoryProvider {
  listVersions(documentUri: string): Promise<DocumentVersion[]>;
  loadVersion(documentUri: string, versionId: string): Promise<SceneSnapshot>;
}
