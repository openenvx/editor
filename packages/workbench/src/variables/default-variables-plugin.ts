import {
  Command,
  ViewContainerContribution,
  ViewContribution,
  WORKBENCH_VARIABLES_CONTAINER_ID,
  WorkbenchNavigationServiceId,
  WorkbenchPlugin,
  type CommandContext,
  type WorkbenchPluginContext,
} from '@openenvx/core';
import {
  addVariableToScene,
  createVariableId,
  nextVariableKey,
  sceneVariables,
} from '@openenvx/core/schema';

import { VariablesPanel } from './variables-panel';

export const VARIABLES_VIEW_ID = 'workbench.variables.panel';
export const VARIABLES_PANEL_COMPONENT_ID = 'workbench.variables.panel';
export const DEFAULT_VARIABLES_PLUGIN_ID = 'openworkbench.default-variables';

class VariablesViewContainer extends ViewContainerContribution {
  readonly id = WORKBENCH_VARIABLES_CONTAINER_ID;
  readonly title = 'Variables';
  readonly defaultLocation = 'secondary' as const;
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarOrder = 5;
  readonly when = "page.layout == 'email'";
}

class VariablesView extends ViewContribution {
  readonly id = VARIABLES_VIEW_ID;
  readonly containerId = WORKBENCH_VARIABLES_CONTAINER_ID;
  readonly name = 'Variables';
  readonly componentId = VARIABLES_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
}

class OpenVariablesPanelCommand extends Command {
  readonly id = 'workbench.openVariablesPanel';

  canExecute(): boolean {
    return true;
  }

  execute(ctx: CommandContext): void {
    const navigation = ctx.services.get(WorkbenchNavigationServiceId);
    if (!navigation) {
      return;
    }
    navigation.setSecondarySidebarVisible(true);
    navigation.setActiveContainer(
      'secondary',
      WORKBENCH_VARIABLES_CONTAINER_ID
    );
  }
}

class CreateVariableCommand extends Command {
  readonly id = 'workbench.createVariable';

  canExecute(): boolean {
    return true;
  }

  execute(ctx: CommandContext): void {
    const variables = sceneVariables(ctx.scene.getScene());
    const variable = {
      id: createVariableId(),
      key: nextVariableKey(variables),
    };
    ctx.scene.apply({
      apply: (scene) => addVariableToScene(scene, variable),
      label: 'Add variable',
    });
    const navigation = ctx.services.get(WorkbenchNavigationServiceId);
    if (!navigation) {
      return;
    }
    navigation.setSecondarySidebarVisible(true);
    navigation.setActiveContainer(
      'secondary',
      WORKBENCH_VARIABLES_CONTAINER_ID
    );
  }
}

export class DefaultVariablesContainerPlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_VARIABLES_PLUGIN_ID;

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.register(new OpenVariablesPanelCommand());
    ctx.register(new CreateVariableCommand());
    ctx.registerWorkbench(new VariablesViewContainer(), new VariablesView());
    ctx.registerViewPanel(VARIABLES_PANEL_COMPONENT_ID, VariablesPanel);
  }
}
