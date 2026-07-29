import { createServiceId } from '@openenvx/core';

import type { WorkbenchLayoutStore } from './workbench-layout-store';

export const WorkbenchLayoutStoreId = createServiceId<WorkbenchLayoutStore>(
  'workbenchLayoutStore'
);
