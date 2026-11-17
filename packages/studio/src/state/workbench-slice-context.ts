import type { Registries } from '../backbone';
import type { WorkbenchProviderRegistries } from '../registries/workbench-provider-registries';
import type { WorkbenchRegistries } from '../registries/workbench-registries';
import type { WorkbenchRuntime } from '../runtime/workbench-runtime';
import type { DialogService } from '../workbench/dialog-service';
import type { ViewLocationService } from '../workbench/view-location-service';
import type { WorkbenchLayout } from '../workbench/workbench-layout';

export interface WorkbenchSliceContext {
  runtime: WorkbenchRuntime;
  coreRegistries: Registries;
  workbenchRegistries: WorkbenchRegistries;
  providerRegistries: WorkbenchProviderRegistries;
  layout: WorkbenchLayout;
  locationService: ViewLocationService;
  dialogService: DialogService;
}
