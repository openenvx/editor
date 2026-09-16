/**
 * Persisted email document (JSON-serializable).
 * Create with `createEmailScene()` or round-trip the value from `onChange`.
 * Page/layer internals are not part of this package's public API.
 */
export interface Scene {
  schemaVersion: number;
  [key: string]: unknown;
}
