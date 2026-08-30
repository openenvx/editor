import { ContextKeyServiceId } from '@openenvx/core';
import { useRef, useSyncExternalStore } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';

/** Bumps when any context key changes - use to re-render toggled toolbar buttons. */
export function useContextKeysRevision(): number {
  const { api } = useWorkbenchContext();
  const keys = api.getService(ContextKeyServiceId);
  const revisionRef = useRef(0);

  return useSyncExternalStore(
    (onStoreChange) => {
      if (!keys) {
        return () => {};
      }
      const sub = keys.onDidChangeContext(() => {
        revisionRef.current += 1;
        onStoreChange();
      });
      return () => sub.dispose();
    },
    () => revisionRef.current,
    () => 0
  );
}

export function useContextKeyValue(
  key: string
): boolean | string | number | undefined {
  const { api } = useWorkbenchContext();
  const keys = api.getService(ContextKeyServiceId);

  return useSyncExternalStore(
    (onStoreChange) => {
      if (!keys) {
        return () => {};
      }
      const sub = keys.onDidChangeContext(() => onStoreChange());
      return () => sub.dispose();
    },
    () => keys?.get(key),
    (): boolean | string | number | undefined => undefined
  );
}
