import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import { CanvasTemplateContainer } from '../contributions/canvas-template-contribution';

export class CanvasTemplatePlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.canvas-pro.template';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new CanvasTemplateContainer());
  }
}
