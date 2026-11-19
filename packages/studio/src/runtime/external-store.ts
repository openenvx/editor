/**
 * Minimal store contract for syncing imperative/OOP state with React via
 * `useSyncExternalStore`. Conformers include workbench controllers and layout stores.
 */
export interface ExternalStore<T> {
  subscribe(listener: (state: T) => void): () => void;
  getSnapshot(): T;
}
