import {
  Command,
  DialogServiceId,
  ViewContainerContribution,
  ViewContribution,
  WorkbenchNavigationServiceId,
  WorkbenchPlugin,
  type CommandContext,
  type WorkbenchPluginContext,
} from '@openenvx/core';
import { sceneVariables } from '@openenvx/core/schema';

import {
  VARIABLES_CONTAINER_ID,
  VARIABLES_EDIT_DIALOG_ID,
  VARIABLES_PLUGIN_ID,
  VARIABLES_VIEW_ID,
} from './constants';
import { VariableEditDialog } from './variable-edit-dialog';
import { VariablesTreeProvider } from './variables-tree-provider';

class VariablesViewContainer extends ViewContainerContribution {
  readonly id = VARIABLES_CONTAINER_ID;
  readonly title = 'Variables';
  readonly defaultLocation = 'secondary' as const;
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarOrder = 1;
}

class VariablesView extends ViewContribution {
  readonly id = VARIABLES_VIEW_ID;
  readonly containerId = VARIABLES_CONTAINER_ID;
  readonly name = 'Variables';
  readonly presentation = 'list' as const;
  readonly viewSelection = 'none' as const;
  readonly collapsible = false;
  readonly viewOrder = 0;
  readonly emptyMessage = 'No variables yet.';
  readonly addCommandId = 'variables.create';
}

class OpenVariablesPanelCommand extends Command {
  readonly id = 'variables.openPanel';

  canExecute(): boolean {
    return true;
  }

  execute(ctx: CommandContext): void {
    const navigation = ctx.services.get(WorkbenchNavigationServiceId);
    if (!navigation) {
      return;
    }
    navigation.setSecondarySidebarVisible(true);
    navigation.setActiveContainer('secondary', VARIABLES_CONTAINER_ID);
  }
}

export class CreateVariableCommand extends Command {
  readonly id = 'variables.create';

  canExecute(): boolean {
    return true;
  }

  execute(ctx: CommandContext): void {
    const navigation = ctx.services.get(WorkbenchNavigationServiceId);
    if (navigation) {
      navigation.setSecondarySidebarVisible(true);
      navigation.setActiveContainer('secondary', VARIABLES_CONTAINER_ID);
    }
    ctx.services.get(DialogServiceId)?.open(VARIABLES_EDIT_DIALOG_ID, {
      mode: 'create',
    });
  }
}

export class EditVariableCommand extends Command {
  readonly id = 'variables.edit';

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
    ctx.services.get(DialogServiceId)?.open(VARIABLES_EDIT_DIALOG_ID, {
      mode: 'edit',
      variable,
    });
  }
}

export class VariablesPlugin extends WorkbenchPlugin {
  readonly id = VARIABLES_PLUGIN_ID;

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
    ctx.registerDialog(VARIABLES_EDIT_DIALOG_ID, VariableEditDialog);
  }
}
