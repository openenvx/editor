import { Command } from '../contributions/command';
import type { CommandContext } from '../runtime/types';
import { findLayerById, updateLayerByIdInScene } from '../scene/layer-tree';
import {
  addVariableToScene,
  createVariableId,
  formatVariableToken,
  isValidVariableKey,
  nextVariableKey,
  removeVariableFromScene,
  reorderVariablesInScene,
  resolvePrimaryTextDataPath,
  sceneVariables,
  updateVariableInScene,
  validateVariableKeyForCatalog,
} from '../schema/template-variables';
import type { TemplateVariable } from '../schema/types';
import { RichTextInsertServiceId } from '../services/rich-text-insert-service';
import { TextBlockInsertServiceId } from '../services/text-block-insert-service';
import { getNestedValue, setNestedValue } from '../utils/nested-value';

function appendTokenToLayerField(
  layer: { data?: unknown },
  dataPath: string,
  token: string
): void {
  const data =
    typeof layer.data === 'object' && layer.data !== null
      ? { ...(layer.data as Record<string, unknown>) }
      : {};
  const current = getNestedValue(data, dataPath);
  const next =
    typeof current === 'string' && current.length > 0
      ? `${current}${token}`
      : token;
  setNestedValue(data, dataPath, next);
  layer.data = data;
}

function catalogHasKey(ctx: CommandContext, key: string): boolean {
  return sceneVariables(ctx.scene.getScene()).some(
    (entry) => entry.key === key
  );
}

function canResolveVariableInsertTarget(ctx: CommandContext): boolean {
  const richText = ctx.services.get(RichTextInsertServiceId);
  if (richText?.hasHandler()) {
    return true;
  }
  const selectedId =
    ctx.selection.primaryLayerId ?? ctx.selection.selectedLayerIds[0];
  if (selectedId) {
    const layer = findLayerById(ctx.scene.getScene(), selectedId);
    if (layer && resolvePrimaryTextDataPath(layer.type)) {
      return true;
    }
  }
  const textBlockInsert = ctx.services.has(TextBlockInsertServiceId)
    ? ctx.services.get(TextBlockInsertServiceId)
    : undefined;
  return textBlockInsert !== undefined;
}

export interface AddVariableArgs {
  key?: string;
  label?: string;
  sample?: string;
}

export class AddVariableCommand extends Command {
  readonly id = 'scene.addVariable';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const patch = args as AddVariableArgs | undefined;
    const variables = sceneVariables(ctx.scene.getScene());
    if (patch?.key !== undefined) {
      const validation = validateVariableKeyForCatalog(variables, patch.key);
      return validation.ok;
    }
    return true;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const patch = (args as AddVariableArgs | undefined) ?? {};
    const variables = sceneVariables(ctx.scene.getScene());
    const key = patch.key?.trim() || nextVariableKey(variables);
    const validation = validateVariableKeyForCatalog(variables, key);
    if (!validation.ok) {
      return;
    }
    const variable: TemplateVariable = {
      id: createVariableId(),
      key,
      label: patch.label?.trim() || undefined,
      sample: patch.sample,
    };
    ctx.scene.apply({
      apply: (scene) => addVariableToScene(scene, variable),
      label: 'Add variable',
    });
  }
}

export interface UpdateVariableArgs {
  id: string;
  key?: string;
  label?: string;
  sample?: string;
}

export class UpdateVariableCommand extends Command {
  readonly id = 'scene.updateVariable';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const patch = args as UpdateVariableArgs | undefined;
    if (!patch?.id) {
      return false;
    }
    const variables = sceneVariables(ctx.scene.getScene());
    const variable = variables.find((entry) => entry.id === patch.id);
    if (!variable) {
      return false;
    }
    if (patch.key !== undefined) {
      const validation = validateVariableKeyForCatalog(
        variables,
        patch.key,
        patch.id
      );
      return validation.ok;
    }
    return true;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const patch = args as UpdateVariableArgs | undefined;
    if (!patch?.id) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) => {
        const next = updateVariableInScene(scene, patch.id, {
          key: patch.key,
          label: patch.label,
          sample: patch.sample,
        });
        return next ?? scene;
      },
      label: 'Update variable',
    });
  }
}

export interface RemoveVariableArgs {
  id: string;
}

export class RemoveVariableCommand extends Command {
  readonly id = 'scene.removeVariable';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const patch = args as RemoveVariableArgs | undefined;
    if (!patch?.id) {
      return false;
    }
    return sceneVariables(ctx.scene.getScene()).some(
      (entry) => entry.id === patch.id
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const patch = args as RemoveVariableArgs | undefined;
    if (!patch?.id) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) => removeVariableFromScene(scene, patch.id),
      label: 'Remove variable',
    });
  }
}

export interface ReorderVariablesArgs {
  activeId: string;
  overId: string;
}

export class ReorderVariablesCommand extends Command {
  readonly id = 'scene.reorderVariables';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const patch = args as ReorderVariablesArgs | undefined;
    if (!patch?.activeId || !patch.overId) {
      return false;
    }
    const variables = sceneVariables(ctx.scene.getScene());
    return (
      variables.some((entry) => entry.id === patch.activeId) &&
      variables.some((entry) => entry.id === patch.overId)
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const patch = args as ReorderVariablesArgs | undefined;
    if (!patch?.activeId || !patch.overId) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) =>
        reorderVariablesInScene(scene, patch.activeId, patch.overId),
      label: 'Reorder variables',
    });
  }
}

export interface InsertVariableArgs {
  key: string;
}

export class InsertVariableCommand extends Command {
  readonly id = 'scene.insertVariable';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const patch = args as InsertVariableArgs | undefined;
    if (!patch?.key || !isValidVariableKey(patch.key)) {
      return false;
    }
    if (!catalogHasKey(ctx, patch.key)) {
      return false;
    }
    return canResolveVariableInsertTarget(ctx);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const patch = args as InsertVariableArgs | undefined;
    if (!patch?.key || !isValidVariableKey(patch.key)) {
      return;
    }
    if (!catalogHasKey(ctx, patch.key)) {
      return;
    }
    const token = formatVariableToken(patch.key);
    const richText = ctx.services.get(RichTextInsertServiceId);
    if (richText?.insert(token)) {
      return;
    }

    const selectedId =
      ctx.selection.primaryLayerId ?? ctx.selection.selectedLayerIds[0];
    if (selectedId) {
      const scene = ctx.scene.getScene();
      const layer = findLayerById(scene, selectedId);
      const dataPath = layer ? resolvePrimaryTextDataPath(layer.type) : null;
      if (layer && dataPath) {
        ctx.scene.apply({
          apply: (currentScene) =>
            updateLayerByIdInScene(currentScene, selectedId, (targetLayer) => {
              const next = { ...targetLayer };
              appendTokenToLayerField(next, dataPath, token);
              return next;
            }),
          label: 'Insert variable',
        });
        return;
      }
    }

    const textBlockInsert = ctx.services.has(TextBlockInsertServiceId)
      ? ctx.services.get(TextBlockInsertServiceId)
      : undefined;
    textBlockInsert?.insert(ctx, token);
  }
}
