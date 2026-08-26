import {
  TreeDataProvider,
  type CommandContext,
  type TreeItem,
} from '@openenvx/core';
import {
  formatVariableToken,
  reorderVariablesInScene,
  sceneVariables,
  type TemplateVariable,
} from '@openenvx/core/schema';

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
          commandId: 'workbench.editVariable',
          icon: 'pencil',
          label: 'Edit variable',
        },
      ],
      description: variable.label,
      id: variable.id,
      label: formatVariableToken(variable.key),
    };
  }

  canMove(
    source: TemplateVariable,
    target: TemplateVariable,
    position: 'before' | 'after' | 'inside'
  ): boolean {
    return source.id !== target.id && position !== 'inside';
  }

  handleMove(
    source: TemplateVariable,
    target: TemplateVariable,
    _position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    ctx.scene.apply({
      apply: (scene) => reorderVariablesInScene(scene, source.id, target.id),
      label: 'Reorder variables',
    });
  }
}
