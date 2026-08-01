import type { RenderNode } from '@openenvx/protocol';

type Listener = () => void;

/**
 * Host-side store for external surface bodies (`render` messages).
 * Views declare a container in the manifest; bodies arrive later as trees.
 */
const trees = new Map<string, RenderNode>();
const listeners = new Set<Listener>();

export const extensionSurfaceStore = {
  get(surfaceId: string): RenderNode | null {
    return trees.get(surfaceId) ?? null;
  },
  set(surfaceId: string, root: RenderNode | null): void {
    if (root) {
      trees.set(surfaceId, root);
    } else {
      trees.delete(surfaceId);
    }
    for (const listener of listeners) {
      listener();
    }
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  clear(): void {
    trees.clear();
    for (const listener of listeners) {
      listener();
    }
  },
};
