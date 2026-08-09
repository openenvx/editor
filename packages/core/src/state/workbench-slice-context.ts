import type { EditorRuntime, Registries } from '../backbone';
import type { WorkbenchProviderRegistries } from '../registries/workbench-provider-registries';
import type { WorkbenchRegistries } from '../registries/workbench-registries';
import type { ViewLocationService } from '../workbench/view-location-service';
import type { WorkbenchLayout } from '../workbench/workbench-layout';

export interface WorkbenchSliceContext {
  runtime: EditorRuntime;
  coreRegistries: Registries;
  workbenchRegistries: WorkbenchRegistries;
  providerRegistries: WorkbenchProviderRegistries;
  layout: WorkbenchLayout;
  locationService: ViewLocationService;
}
