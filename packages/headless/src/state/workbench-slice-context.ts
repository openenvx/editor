import type {
  EditorService,
  PluginManager,
  SceneStore,
  WorkbenchLayout,
} from '@openenvx/core';

export interface WorkbenchSliceContext {
  manager: PluginManager;
  sceneStore: SceneStore;
  editorService: EditorService;
  layout: WorkbenchLayout;
}
