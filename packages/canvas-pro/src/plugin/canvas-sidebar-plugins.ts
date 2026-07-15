import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import {
  CanvasLayersTreeProvider,
  CanvasLayersView,
  CanvasPagesTreeProvider,
  CanvasPagesView,
  CanvasSidebarContainer,
} from '../contributions/canvas-sidebar-contributions';

export class CanvasSidebarPlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.canvas-pro.sidebar';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new CanvasSidebarContainer());
  }
}

export class CanvasPagesPlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.canvas-pro.pages';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new CanvasPagesView());
    ctx.registerTreeDataProvider('canvas.pages', new CanvasPagesTreeProvider());
  }
}

export class CanvasLayersPlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.canvas-pro.layers';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new CanvasLayersView());
    ctx.registerTreeDataProvider(
      'canvas.layers',
      new CanvasLayersTreeProvider()
    );
  }
}
