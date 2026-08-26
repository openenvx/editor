import {
  Command,
  DialogServiceId,
  ViewContainerContribution,
  ViewContribution,
  WORKBENCH_VARIABLES_CONTAINER_ID,
  WorkbenchNavigationServiceId,
  WorkbenchPlugin,
  type CommandContext,
  type WorkbenchPluginContext,
} from '@openenvx/core';
import { sceneVariables } from '@openenvx/core/schema';

import {
  VariableEditDialog,
  WORKBENCH_VARIABLES_EDIT_DIALOG_ID,
} from './variable-edit-dialog';
import { VariablesTreeProvider } from './variables-tree-provider';

export const VARIABLES_VIEW_ID = 'workbench.variables.panel';
export const DEFAULT_VARIABLES_PLUGIN_ID = 'openworkbench.default-variables';

class VariablesViewContainer extends ViewContainerContribution {
  readonly id = WORKBENCH_VARIABLES_CONTAINER_ID;
  readonly title = 'Variables';
  readonly defaultLocation = 'secondary' as const;
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarOrder = 1;
  readonly when = "page.layout == 'email'";
}

class VariablesView extends ViewContribution {
  readonly id = VARIABLES_VIEW_ID;
  readonly containerId = WORKBENCH_VARIABLES_CONTAINER_ID;
  readonly name = 'Variables';
  readonly presentation = 'list' as const;
  readonly viewSelection = 'none' as const;
  readonly collapsible = false;
  readonly viewOrder = 0;
  readonly emptyMessage = 'No variables yet.';
  readonly addCommandId = 'workbench.createVariable';
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

export class CreateVariableCommand extends Command {
  readonly id = 'workbench.createVariable';

  canExecute(): boolean {
    return true;
  }

  execute(ctx: CommandContext): void {
    const navigation = ctx.services.get(WorkbenchNavigationServiceId);
    if (navigation) {
      navigation.setSecondarySidebarVisible(true);
      navigation.setActiveContainer(
        'secondary',
        WORKBENCH_VARIABLES_CONTAINER_ID
      );
    }
    ctx.services
      .get(DialogServiceId)
      ?.open(WORKBENCH_VARIABLES_EDIT_DIALOG_ID, {
        mode: 'create',
      });
  }
}

export class EditVariableCommand extends Command {
  readonly id = 'workbench.editVariable';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const patch = args as { id?: string } | undefined;
    if (!patch?.id) {
      return false;
    }
    return sceneVariables(ctx.scene.getScene()).some(
      (entry) => entry.id === patch.id
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const patch = args as { id?: string } | undefined;
    if (!patch?.id) {
      return;
    }
    const variable = sceneVariables(ctx.scene.getScene()).find(
      (entry) => entry.id === patch.id
    );
    if (!variable) {
      return;
    }
    ctx.services
      .get(DialogServiceId)
      ?.open(WORKBENCH_VARIABLES_EDIT_DIALOG_ID, {
        mode: 'edit',
        variable,
      });
  }
}

export class DefaultVariablesContainerPlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_VARIABLES_PLUGIN_ID;

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.register(
      new OpenVariablesPanelCommand(),
      new CreateVariableCommand(),
      new EditVariableCommand()
    );
    ctx.registerWorkbench(new VariablesViewContainer(), new VariablesView());
    ctx.registerTreeDataProvider(
      VARIABLES_VIEW_ID,
      new VariablesTreeProvider()
    );
    ctx.registerDialog(WORKBENCH_VARIABLES_EDIT_DIALOG_ID, VariableEditDialog);
  }
}

export { VariablesTreeProvider };
