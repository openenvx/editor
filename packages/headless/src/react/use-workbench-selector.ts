import { useCallback, useRef, useSyncExternalStore } from 'react';

import type { WorkbenchApi, WorkbenchState } from '../workbench-controller';
import { useWorkbenchContext } from './workbench-api-context';

export function useWorkbenchSelector<T>(
  api: WorkbenchApi | null,
  selector: (state: WorkbenchState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T | null {
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  const snapshotRef = useRef<{ state: WorkbenchState; selected: T } | null>(
    null
  );

  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!api) {
        return () => {};
      }
      return api.subscribe((state) => {
        const selected = selectorRef.current(state);
        const prev = snapshotRef.current;
        if (
          !prev ||
          prev.state !== state ||
          !isEqualRef.current(prev.selected, selected)
        ) {
          snapshotRef.current = { selected, state };
          onStoreChange();
        }
      });
    },
    [api]
  );

  const getSnapshot = useCallback((): T | null => {
    if (!api) {
      return null;
    }
    const state = api.getState();
    const selected = selectorRef.current(state);
    snapshotRef.current = { selected, state };
    return selected;
  }, [api]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useWorkbenchContextSelector<T>(
  selector: (state: WorkbenchState) => T,
  isEqual?: (a: T, b: T) => boolean
): T | null {
  const { api } = useWorkbenchContext();
  return useWorkbenchSelector(api, selector, isEqual);
}
