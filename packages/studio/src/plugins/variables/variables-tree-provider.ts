import {
  TreeDataProvider,
  type CommandContext,
  type TreeItem,
} from '@openenvx/studio/core';
import { sceneVariables, type TemplateVariable } from '@openenvx/studio/schema';

export class VariablesTreeProvider extends TreeDataProvider<TemplateVariable> {
  getRootChildren(ctx: CommandContext): TemplateVariable[] {
    return sceneVariables(ctx.scene.getScene());
  }

  getChildren(): TemplateVariable[] {
    return [];
  }

  getTreeItem(variable: TemplateVariable, _ctx: CommandContext): TreeItem {
    return {
      actions: [
        {
          commandId: 'variables.edit',
          icon: 'pencil',
          label: 'Edit variable',
        },
      ],
      id: variable.id,
      label: variable.key,
    };
  }
}
