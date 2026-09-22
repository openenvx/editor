import {
  Command,
  DialogServiceId,
  ViewContainerContribution,
  ViewContribution,
  WorkbenchNavigationServiceId,
  WorkbenchPlugin,
  type CommandContext,
  type WorkbenchPluginContext,
} from '#studio';
import { documentVariables } from '#studio/schema';

import { executeSceneVariableCommand } from '../template-variable-commands';
import {
  VARIABLES_CONTAINER_ID,
  VARIABLES_PLUGIN_ID,
  VARIABLES_VIEW_ID,
} from './constants';
import {
  buildVariableFormOptions,
  VARIABLE_FORM_DELETE_ACTION,
} from './variable-form';
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

function openVariablesPanel(ctx: CommandContext): void {
  const navigation = ctx.services.get(WorkbenchNavigationServiceId);
  if (navigation) {
    navigation.setSecondarySidebarVisible(true);
    navigation.setActiveContainer('secondary', VARIABLES_CONTAINER_ID);
  }
}

export class CreateVariableCommand extends Command {
  readonly id = 'variables.create';

  canExecute(): boolean {
    return true;
  }

  async execute(ctx: CommandContext): Promise<void> {
    openVariablesPanel(ctx);
    const dialogs = ctx.services.get(DialogServiceId);
    if (!dialogs) {
      return;
    }
    const result = await dialogs.showForm(
      buildVariableFormOptions(
        ctx.services,
        () => ctx.scene.getScene(),
        'create'
      )
    );
    if (!result || result.action !== 'submit') {
      return;
    }
    const key = String(result.values.key ?? '').trim();
    const sample = String(result.values.sample ?? '');
    await executeSceneVariableCommand(ctx, 'scene.addVariable', {
      key,
      sample,
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
    return documentVariables(ctx.scene.getScene()).some(
      (entry) => entry.id === patch.id
    );
  }

  async execute(ctx: CommandContext, args?: unknown): Promise<void> {
    const patch = args as { id?: string } | undefined;
    if (!patch?.id) {
      return;
    }
    const scene = ctx.scene.getScene();
    const variable = documentVariables(scene).find(
      (entry) => entry.id === patch.id
    );
    if (!variable) {
      return;
    }
    const dialogs = ctx.services.get(DialogServiceId);
    if (!dialogs) {
      return;
    }
    const result = await dialogs.showForm(
      buildVariableFormOptions(
        ctx.services,
        () => ctx.scene.getScene(),
        'edit',
        variable
      )
    );
    if (!result) {
      return;
    }
    if (result.action === VARIABLE_FORM_DELETE_ACTION) {
      await executeSceneVariableCommand(ctx, 'scene.removeVariable', {
        id: variable.id,
      });
      return;
    }
    if (result.action !== 'submit') {
      return;
    }
    const key = String(result.values.key ?? '').trim();
    const sample = String(result.values.sample ?? '');
    await executeSceneVariableCommand(ctx, 'scene.updateVariable', {
      id: variable.id,
      key,
      sample,
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
  }
}
