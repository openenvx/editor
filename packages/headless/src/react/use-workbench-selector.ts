import type { WorkbenchApi, WorkbenchState } from '../workbench-state';
import { useStoreSelector } from './use-store-selector';
import { useWorkbenchContext } from './workbench-api-context';

export function useWorkbenchSelector<T>(
  api: WorkbenchApi | null,
  selector: (state: WorkbenchState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T | null {
  return useStoreSelector(api, selector, isEqual);
}

export function useWorkbenchContextSelector<T>(
  selector: (state: WorkbenchState) => T,
  isEqual?: (a: T, b: T) => boolean
): T | null {
  const { api } = useWorkbenchContext();
  return useWorkbenchSelector(api, selector, isEqual);
}
