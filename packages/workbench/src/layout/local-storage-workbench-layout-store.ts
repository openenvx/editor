import type {
  WorkbenchLayoutSnapshot,
  WorkbenchLayoutStore,
} from '@openenvx/core';

/**
 * Trivial localStorage-backed layout store for demos and hosts that want
 * persistence without a backend.
 */
export function createLocalStorageWorkbenchLayoutStore(
  storageKey: string
): WorkbenchLayoutStore {
  return {
    load() {
      try {
        const raw = globalThis.localStorage?.getItem(storageKey);
        if (!raw) {
          return null;
        }
        const parsed = JSON.parse(raw) as WorkbenchLayoutSnapshot;
        // ponytail: shallow parse only; corrupt keys are dropped on apply - add Zod if hosts need strict validation.
        if (!parsed || typeof parsed !== 'object') {
          return null;
        }
        return {
          locations:
            parsed.locations && typeof parsed.locations === 'object'
              ? parsed.locations
              : {},
          orders:
            parsed.orders && typeof parsed.orders === 'object'
              ? parsed.orders
              : undefined,
          visibility:
            parsed.visibility && typeof parsed.visibility === 'object'
              ? parsed.visibility
              : {},
        };
      } catch {
        return null;
      }
    },
    save(snapshot) {
      try {
        globalThis.localStorage?.setItem(storageKey, JSON.stringify(snapshot));
      } catch {
        // Ignore quota / private-mode failures.
      }
    },
  };
}
