import type { EditorRuntime, Registries } from '@openenvx/core';

import type { WorkbenchProviderRegistries } from '../registries/workbench-provider-registries';
import type { WorkbenchRegistries } from '../registries/workbench-registries';
import type { WorkbenchLayout } from '../workbench/workbench-layout';

export interface WorkbenchSliceContext {
  runtime: EditorRuntime;
  coreRegistries: Registries;
  workbenchRegistries: WorkbenchRegistries;
  providerRegistries: WorkbenchProviderRegistries;
  layout: WorkbenchLayout;
}
