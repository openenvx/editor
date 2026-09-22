import type { ViewContainerLocation } from '../contributions/view-contribution';
import type { WorkbenchLayout } from '../workbench/workbench-layout';

export interface WorkbenchLayoutSnapshot {
  visibility: Partial<
    Pick<WorkbenchLayout, 'activityBar' | 'primarySidebar' | 'secondarySidebar'>
  >;
  locations: Record<string, ViewContainerLocation>;
  /** Ordered container ids per location (activity bar / secondary tabs). */
  orders?: Partial<Record<ViewContainerLocation, string[]>>;
  /** Last active panel per sidebar location. */
  activeByLocation?: Partial<Record<ViewContainerLocation, string>>;
}

/**
 * Optional host-supplied persistence for sidebar visibility and view-container
 * locations. Register via `WorkbenchControllerOptions.layoutStore` or
 * `ctx.services.registerInstance(WorkbenchLayoutStoreId, store)`.
 */
export interface WorkbenchLayoutStore {
  load():
    | Promise<WorkbenchLayoutSnapshot | null>
    | WorkbenchLayoutSnapshot
    | null;
  save(snapshot: WorkbenchLayoutSnapshot): Promise<void> | void;
}
