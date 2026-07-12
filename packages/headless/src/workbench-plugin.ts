import { Plugin, type PluginContext } from '@openenvx/core';

import type { WorkbenchPluginContext } from './workbench-plugin-context';

export abstract class WorkbenchPlugin extends Plugin {
  abstract activateWorkbench(ctx: WorkbenchPluginContext): void | Promise<void>;

  activate(ctx: PluginContext): void | Promise<void> {
    return this.activateWorkbench(ctx as WorkbenchPluginContext);
  }
}
