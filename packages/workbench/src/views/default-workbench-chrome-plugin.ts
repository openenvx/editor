import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import {
  LayersTreeProvider,
  PagesTreeProvider,
  WORKBENCH_LAYERS_VIEW_ID,
  WORKBENCH_PAGES_VIEW_ID,
  WorkbenchLayersView,
  WorkbenchPagesView,
  WorkbenchSidebarContainer,
  WorkbenchStatusBarContribution,
} from './workbench-chrome-contributions';

export const DEFAULT_WORKBENCH_CHROME_PLUGIN_ID =
  'openworkbench.default-chrome';

/** Pages + Layers activity sidebar and generic dirty status. */
export class DefaultWorkbenchChromePlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_WORKBENCH_CHROME_PLUGIN_ID;

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(
      new WorkbenchSidebarContainer(),
      new WorkbenchPagesView(),
      new WorkbenchLayersView(),
      new WorkbenchStatusBarContribution()
    );
    ctx.registerTreeDataProvider(
      WORKBENCH_PAGES_VIEW_ID,
      new PagesTreeProvider()
    );
    ctx.registerTreeDataProvider(
      WORKBENCH_LAYERS_VIEW_ID,
      new LayersTreeProvider()
    );
  }
}
