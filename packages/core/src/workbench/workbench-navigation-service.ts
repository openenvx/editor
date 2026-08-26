import type { ViewContainerLocation } from '../contributions/view-contribution';
import { createServiceId } from '../runtime/create-service-id';

export interface WorkbenchNavigationService {
  setActiveContainer(
    location: ViewContainerLocation,
    containerId: string
  ): void;
  setSecondarySidebarVisible(visible: boolean): void;
}

export class WorkbenchNavigationServiceImpl implements WorkbenchNavigationService {
  private setActiveContainerFn: WorkbenchNavigationService['setActiveContainer'] =
    () => {};
  private setSecondarySidebarVisibleFn: WorkbenchNavigationService['setSecondarySidebarVisible'] =
    () => {};

  bind(host: {
    setActiveContainer: WorkbenchNavigationService['setActiveContainer'];
    setSecondarySidebarVisible: WorkbenchNavigationService['setSecondarySidebarVisible'];
  }): void {
    this.setActiveContainerFn = host.setActiveContainer;
    this.setSecondarySidebarVisibleFn = host.setSecondarySidebarVisible;
  }

  setActiveContainer(
    location: ViewContainerLocation,
    containerId: string
  ): void {
    this.setActiveContainerFn(location, containerId);
  }

  setSecondarySidebarVisible(visible: boolean): void {
    this.setSecondarySidebarVisibleFn(visible);
  }
}

export const WorkbenchNavigationServiceId =
  createServiceId<WorkbenchNavigationService>('workbenchNavigation');
