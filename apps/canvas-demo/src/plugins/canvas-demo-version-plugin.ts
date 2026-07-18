import {
  ViewContainerContribution,
  ViewContribution,
  WorkbenchPlugin,
  type WorkbenchPluginContext,
} from '@openenvx/headless';

import { VersionPanel } from '../panels/version-panel';

export const VERSION_CONTAINER_ID = 'canvas-demo.version';
export const VERSION_VIEW_ID = 'canvas-demo.version.panel';
export const VERSION_PANEL_COMPONENT_ID = 'canvas-demo.version.panel';

class VersionSidebarContainer extends ViewContainerContribution {
  readonly id = VERSION_CONTAINER_ID;
  readonly title = 'Version';
  readonly defaultLocation = 'secondary' as const;
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarOrder = 10;
}

class VersionView extends ViewContribution {
  readonly id = VERSION_VIEW_ID;
  readonly containerId = VERSION_CONTAINER_ID;
  readonly name = 'Version';
  readonly componentId = VERSION_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
}

export class CanvasDemoVersionPlugin extends WorkbenchPlugin {
  readonly id = 'canvas-demo.version';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new VersionSidebarContainer(), new VersionView());
    ctx.registerViewPanel(VERSION_PANEL_COMPONENT_ID, VersionPanel);
  }
}
