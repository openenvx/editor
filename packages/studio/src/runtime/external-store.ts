/**
 * Minimal store contract for syncing imperative/OOP state with React via
 * `useSyncExternalStore`. Conformers include `DocumentStore` and workbench APIs.
 */
export interface ExternalStore<T> {
  subscribe(listener: (state: T) => void): () => void;
  getSnapshot(): T;
}
