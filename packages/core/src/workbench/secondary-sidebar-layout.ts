import type { WorkbenchLayout } from './workbench-layout';
import type { ViewContainerDescriptor } from './workbench-state';

export function secondaryPanelContainers(
  viewContainers: ViewContainerDescriptor[] | null | undefined
): ViewContainerDescriptor[] {
  return (viewContainers ?? []).filter(
    (container) =>
      container.location === 'secondary' &&
      container.sidebarBehavior === 'panel'
  );
}

/** Mount secondary aside chrome only when layout allows and panel containers exist. */
export function shouldMountSecondarySidebar(
  layout: WorkbenchLayout | null | undefined,
  viewContainers: ViewContainerDescriptor[] | null | undefined
): boolean {
  if (!layout?.secondarySidebar) {
    return false;
  }
  return secondaryPanelContainers(viewContainers).length > 0;
}
