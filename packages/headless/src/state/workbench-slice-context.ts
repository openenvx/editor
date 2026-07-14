import type { EditorService, PluginManager, SceneStore } from '@openenvx/core';

import type { WorkbenchProviderRegistries } from '../registries/workbench-provider-registries';
import type { WorkbenchRegistries } from '../registries/workbench-registries';
import type { WorkbenchLayout } from '../workbench/workbench-layout';

export interface WorkbenchSliceContext {
  manager: PluginManager;
  workbenchRegistries: WorkbenchRegistries;
  providerRegistries: WorkbenchProviderRegistries;
  sceneStore: SceneStore;
  editorService: EditorService;
  layout: WorkbenchLayout;
}
