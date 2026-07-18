import {
  ViewContainerContribution,
  WORKBENCH_INSPECTOR_CONTAINER_ID,
  WorkbenchPlugin,
  type WorkbenchPluginContext,
} from '@openenvx/headless';

class InspectorViewContainer extends ViewContainerContribution {
  readonly id = WORKBENCH_INSPECTOR_CONTAINER_ID;
  readonly title = 'Inspector';
  readonly defaultLocation = 'secondary' as const;
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarOrder = 0;
}

export const DEFAULT_INSPECTOR_PLUGIN_ID = 'openworkbench.default-inspector';

export class DefaultInspectorContainerPlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_INSPECTOR_PLUGIN_ID;

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new InspectorViewContainer());
  }
}
