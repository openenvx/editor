import type { PluginContext } from '@openenvx/core';

import {
  registerWorkbenchContribution,
  type WorkbenchRegistries,
} from './registries/workbench-registries';
import type { WorkbenchContribution } from './workbench-contributions/workbench-contribution';

export interface WorkbenchPluginContext extends PluginContext {
  registerWorkbench(...contributions: WorkbenchContribution[]): void;
}

export function createWorkbenchPluginContext(
  base: PluginContext,
  workbenchRegistries: WorkbenchRegistries
): WorkbenchPluginContext {
  return {
    commands: base.commands,
    contextKeys: base.contextKeys,
    editor: base.editor,
    events: base.events,
    register: base.register.bind(base),
    registerWorkbench(...contributions: WorkbenchContribution[]): void {
      for (const contribution of contributions) {
        registerWorkbenchContribution(workbenchRegistries, contribution);
      }
    },
    scene: base.scene,
    services: base.services,
  };
}
