import { useCallback, useRef, useSyncExternalStore } from 'react';

import type { ExternalStore } from '../backbone';

export function useStoreSelector<T, S>(
  store: ExternalStore<T>,
  selector: (state: T) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useStoreSelector<T, S>(
  store: ExternalStore<T> | null,
  selector: (state: T) => S,
  isEqual?: (a: S, b: S) => boolean
): S | null;
export function useStoreSelector<T, S>(
  store: ExternalStore<T> | null,
  selector: (state: T) => S,
  isEqual: (a: S, b: S) => boolean = Object.is
): S | null {
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  const snapshotRef = useRef<{ state: T; selected: S } | null>(null);

  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!store) {
        return () => {};
      }
      return store.subscribe((state) => {
        const prev = snapshotRef.current;
        if (prev?.state === state) {
          return;
        }
        const nextSelected = selectorRef.current(state);
        if (prev && isEqualRef.current(prev.selected, nextSelected)) {
          snapshotRef.current = { selected: prev.selected, state };
          return;
        }
        snapshotRef.current = { selected: nextSelected, state };
        onStoreChange();
      });
    },
    [store]
  );

  const getSnapshot = useCallback((): S | null => {
    if (!store) {
      return null;
    }
    const state = store.getSnapshot();
    const nextSelected = selectorRef.current(state);
    const prev = snapshotRef.current;
    if (prev && isEqualRef.current(prev.selected, nextSelected)) {
      snapshotRef.current = { selected: prev.selected, state };
      return prev.selected;
    }
    snapshotRef.current = { selected: nextSelected, state };
    return nextSelected;
  }, [store]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
