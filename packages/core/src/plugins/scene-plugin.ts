import type { LayerWriteMode, TemplatePolicy } from '@xmazu/openenvxee-schema';
import { LAYER_WRITE_MODES } from '@xmazu/openenvxee-schema';

import { Command } from '../contributions/command';
import { ShortcutContribution } from '../contributions/shortcut-contribution';
import { Plugin } from '../core/plugin';
import type { PluginContext } from '../core/plugin-manager';
import type { CommandContext } from '../runtime/types';
import {
  canDeleteLayer,
  canInsertLayers,
  canReorderLayer,
  isLayerEditable,
  isLayerLocked,
  isLayerVisible,
  isTemplatePolicyEnforced,
} from '../scene/layer-editability';
import {
  findLayerById,
  removeLayerFromTree,
  updateLayerInTree,
  walkLayers,
} from '../scene/layer-tree';
import {
  createBlankPageLike,
  createPageId,
  duplicatePageModel,
  duplicatePageName,
  nextPageName,
} from '../scene/page-ops';
import { reorderLayers, moveLayerToIndex } from '../scene/scene-store';
import { getActivePage } from '../scene/types';

export class UndoCommand extends Command {
  readonly id = 'scene.undo';

  canExecute(ctx: CommandContext): boolean {
    return ctx.scene.canUndo();
  }

  execute(ctx: CommandContext): void {
    ctx.scene.undo();
  }
}

export class RedoCommand extends Command {
  readonly id = 'scene.redo';

  canExecute(ctx: CommandContext): boolean {
    return ctx.scene.canRedo();
  }

  execute(ctx: CommandContext): void {
    ctx.scene.redo();
  }
}

export class DeleteLayerCommand extends Command {
  readonly id = 'scene.deleteLayer';

  canExecute(ctx: CommandContext): boolean {
    if (ctx.selection.selectedLayerIds.length === 0) {
      return false;
    }
    const scene = ctx.scene.getScene();
    return ctx.selection.selectedLayerIds.every((id) => {
      const layer = findLayerById(scene, id);
      return layer && canDeleteLayer(layer, scene);
    });
  }

  execute(ctx: CommandContext): void {
    const ids = new Set(ctx.selection.selectedLayerIds);
    const activePageId = ctx.selection.activePageId;
    ctx.scene.apply({
      apply: (scene) => {
        const page = getActivePage(scene, activePageId);
        let layers = page.layers;
        for (const id of ids) {
          layers = removeLayerFromTree(layers, id);
        }
        return {
          ...scene,
          pages: scene.pages.map((p) =>
            p.id === page.id ? { ...p, layers } : p
          ),
        };
      },
      label: 'Delete layers',
    });
    ctx.scene.setSelection({
      activePageId,
      primaryLayerId: null,
      selectedLayerIds: [],
    });
  }
}

class MoveLayerRelativeCommand extends Command {
  readonly id: 'scene.moveUp' | 'scene.moveDown';
  private readonly direction: 'up' | 'down';
  private readonly applyLabel: string;

  constructor(direction: 'up' | 'down') {
    super();
    this.direction = direction;
    this.id = direction === 'up' ? 'scene.moveUp' : 'scene.moveDown';
    this.applyLabel = direction === 'up' ? 'Move layer up' : 'Move layer down';
  }

  canExecute(ctx: CommandContext): boolean {
    const page = ctx.scene.getActivePage();
    const id = ctx.selection.primaryLayerId;
    if (!id) {
      return false;
    }
    const layer = page.layers.find((l) => l.id === id);
    if (!layer || !canReorderLayer(layer)) {
      return false;
    }
    const index = page.layers.indexOf(layer);
    if (index === -1) {
      return false;
    }
    return this.direction === 'up' ? index > 0 : index < page.layers.length - 1;
  }

  execute(ctx: CommandContext): void {
    const id = ctx.selection.primaryLayerId;
    if (!id) {
      return;
    }
    const activePageId = ctx.selection.activePageId;
    ctx.scene.apply({
      apply: (scene) => {
        const page = getActivePage(scene, activePageId);
        return {
          ...scene,
          pages: scene.pages.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  layers: reorderLayers(p.layers, id, this.direction),
                }
              : p
          ),
        };
      },
      label: this.applyLabel,
    });
  }
}

export class MoveUpCommand extends MoveLayerRelativeCommand {
  constructor() {
    super('up');
  }
}

export class MoveDownCommand extends MoveLayerRelativeCommand {
  constructor() {
    super('down');
  }
}

export interface MoveLayerArgs {
  layerId: string;
  targetIndex: number;
}

export class MoveLayerCommand extends Command {
  readonly id = 'scene.moveLayer';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const moveArgs = args as MoveLayerArgs | undefined;
    if (!moveArgs?.layerId) {
      return false;
    }
    const scene = ctx.scene.getScene();
    const layer = findLayerById(scene, moveArgs.layerId);
    if (!layer || !canReorderLayer(layer)) {
      return false;
    }
    const page = getActivePage(scene, ctx.selection.activePageId);
    return page.layers.some((l) => l.id === moveArgs.layerId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const moveArgs = args as MoveLayerArgs | undefined;
    if (!moveArgs?.layerId) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) => {
        const page = getActivePage(scene, ctx.selection.activePageId);
        return {
          ...scene,
          pages: scene.pages.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  layers: moveLayerToIndex(
                    p.layers,
                    moveArgs.layerId,
                    moveArgs.targetIndex
                  ),
                }
              : p
          ),
        };
      },
      label: 'Move layer',
    });
  }
}

export class ToggleLayerLockCommand extends Command {
  readonly id = 'scene.toggleLayerLock';

  canExecute(ctx: CommandContext): boolean {
    const id = ctx.selection.primaryLayerId;
    if (!id) {
      return false;
    }
    const scene = ctx.scene.getScene();
    const layer = findLayerById(scene, id);
    return layer ? isLayerEditable(layer) : false;
  }

  execute(ctx: CommandContext): void {
    const id = ctx.selection.primaryLayerId;
    if (!id) {
      return;
    }
    const scene = ctx.scene.getScene();
    const layer = findLayerById(scene, id);
    if (!layer || !isLayerEditable(layer)) {
      return;
    }
    const nextLocked = !isLayerLocked(layer);
    ctx.scene.apply({
      apply: (currentScene) => ({
        ...currentScene,
        pages: currentScene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, id, (l) => ({
            ...l,
            locked: nextLocked,
          })),
        })),
      }),
      label: nextLocked ? 'Lock layer' : 'Unlock layer',
    });
  }
}

export class ToggleLayerVisibilityCommand extends Command {
  readonly id = 'scene.toggleLayerVisibility';

  canExecute(ctx: CommandContext): boolean {
    const id = ctx.selection.primaryLayerId;
    if (!id) {
      return false;
    }
    const scene = ctx.scene.getScene();
    const layer = findLayerById(scene, id);
    return layer ? isLayerEditable(layer) : false;
  }

  execute(ctx: CommandContext): void {
    const id = ctx.selection.primaryLayerId;
    if (!id) {
      return;
    }
    const scene = ctx.scene.getScene();
    const layer = findLayerById(scene, id);
    if (!layer || !isLayerEditable(layer)) {
      return;
    }
    const nextVisible = !isLayerVisible(layer);
    ctx.scene.apply({
      apply: (currentScene) => ({
        ...currentScene,
        pages: currentScene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, id, (l) => ({
            ...l,
            visible: nextVisible,
          })),
        })),
      }),
      label: nextVisible ? 'Show layer' : 'Hide layer',
    });
    if (!nextVisible) {
      const selection = ctx.scene.getSelection();
      const remaining = selection.selectedLayerIds.filter(
        (selectedId) => selectedId !== id
      );
      ctx.scene.selectLayers(remaining, remaining[0] ?? null);
    }
  }
}

export class AddPageCommand extends Command {
  readonly id = 'scene.addPage';

  canExecute(ctx: CommandContext): boolean {
    return canInsertLayers(ctx.scene.getScene());
  }

  execute(ctx: CommandContext): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    const source = ctx.scene.getActivePage();
    const pages = ctx.scene.getScene().pages;
    const newId = createPageId();
    const page = createBlankPageLike(
      source,
      newId,
      nextPageName(pages.map((p) => p.name))
    );
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        pages: [...scene.pages, page],
      }),
      activePageId: newId,
      label: 'Add page',
    });
  }
}

export class RemovePageCommand extends Command {
  readonly id = 'scene.removePage';

  canExecute(ctx: CommandContext): boolean {
    const scene = ctx.scene.getScene();
    if (scene.pages.length <= 1) {
      return false;
    }
    if (scene.templatePolicy?.allowDeleteLayers === false) {
      return false;
    }
    const page = ctx.scene.getActivePage();
    let allowed = true;
    walkLayers(page.layers, (layer) => {
      if (!canDeleteLayer(layer, scene)) {
        allowed = false;
      }
    });
    return allowed;
  }

  execute(ctx: CommandContext): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    const scene = ctx.scene.getScene();
    const activePageId = ctx.scene.getActivePageId();
    const index = scene.pages.findIndex((p) => p.id === activePageId);
    if (index === -1) {
      return;
    }
    const neighbor = scene.pages[index - 1] ?? scene.pages[index + 1];
    if (!neighbor) {
      return;
    }
    ctx.scene.apply({
      apply: (current) => ({
        ...current,
        pages: current.pages.filter((p) => p.id !== activePageId),
      }),
      activePageId: neighbor.id,
      label: 'Delete page',
    });
  }
}

export class DuplicatePageCommand extends Command {
  readonly id = 'scene.duplicatePage';

  canExecute(ctx: CommandContext): boolean {
    const scene = ctx.scene.getScene();
    if (!canInsertLayers(scene)) {
      return false;
    }
    if (scene.templatePolicy?.allowDuplicateLayers === false) {
      return false;
    }
    return true;
  }

  execute(ctx: CommandContext): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    const source = ctx.scene.getActivePage();
    const newId = createPageId();
    const page = duplicatePageModel(
      source,
      newId,
      duplicatePageName(source.name)
    );
    ctx.scene.apply({
      apply: (scene) => {
        const index = scene.pages.findIndex((p) => p.id === source.id);
        if (index === -1) {
          return { ...scene, pages: [...scene.pages, page] };
        }
        const pages = [...scene.pages];
        pages.splice(index + 1, 0, page);
        return { ...scene, pages };
      },
      activePageId: newId,
      label: 'Duplicate page',
    });
  }
}

export interface RenamePageArgs {
  id: string;
  name: string;
}

export class RenamePageCommand extends Command {
  readonly id = 'scene.renamePage';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const renameArgs = args as RenamePageArgs | undefined;
    if (!renameArgs?.id || typeof renameArgs.name !== 'string') {
      return false;
    }
    return ctx.scene.getScene().pages.some((p) => p.id === renameArgs.id);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const renameArgs = args as RenamePageArgs | undefined;
    if (!renameArgs?.id || typeof renameArgs.name !== 'string') {
      return;
    }
    const trimmed = renameArgs.name.trim();
    if (!trimmed) {
      return;
    }
    const page = ctx.scene.getScene().pages.find((p) => p.id === renameArgs.id);
    if (!page || page.name === trimmed) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === renameArgs.id ? { ...p, name: trimmed } : p
        ),
      }),
      label: 'Rename page',
    });
  }
}

export interface RenameLayerArgs {
  id: string;
  name: string;
}

export class RenameLayerCommand extends Command {
  readonly id = 'scene.renameLayer';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const renameArgs = args as RenameLayerArgs | undefined;
    if (!renameArgs?.id || typeof renameArgs.name !== 'string') {
      return false;
    }
    return Boolean(findLayerById(ctx.scene.getScene(), renameArgs.id));
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const renameArgs = args as RenameLayerArgs | undefined;
    if (!renameArgs?.id || typeof renameArgs.name !== 'string') {
      return;
    }
    const scene = ctx.scene.getScene();
    const layer = findLayerById(scene, renameArgs.id);
    if (!layer) {
      return;
    }
    const trimmed = renameArgs.name.trim();
    const nextName = trimmed || undefined;
    const currentName = layer.name?.trim() || undefined;
    if (currentName === nextName) {
      return;
    }
    ctx.scene.apply({
      apply: (currentScene) => ({
        ...currentScene,
        pages: currentScene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, renameArgs.id, (l) => {
            if (nextName === undefined) {
              const { name: _removed, ...rest } = l;
              return rest as typeof l;
            }
            return { ...l, name: nextName };
          }),
        })),
      }),
      label: 'Rename layer',
    });
  }
}

function isLayerWriteMode(value: unknown): value is LayerWriteMode {
  return (
    typeof value === 'string' &&
    (LAYER_WRITE_MODES as readonly string[]).includes(value)
  );
}

export class SetLayerWriteModeCommand extends Command {
  readonly id = 'scene.setLayerWriteMode';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const writeMode = (args as { writeMode?: unknown } | undefined)?.writeMode;
    if (!isLayerWriteMode(writeMode)) {
      return false;
    }
    return Boolean(ctx.selection.primaryLayerId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const writeMode = (args as { writeMode?: unknown } | undefined)?.writeMode;
    const id = ctx.selection.primaryLayerId;
    if (!id || !isLayerWriteMode(writeMode)) {
      return;
    }
    ctx.scene.apply({
      apply: (currentScene) => ({
        ...currentScene,
        pages: currentScene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, id, (l) => ({
            ...l,
            writeMode,
          })),
        })),
      }),
      label: 'Set layer write mode',
    });
  }
}

export class SetLayerShowInLayersCommand extends Command {
  readonly id = 'scene.setLayerShowInLayers';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const showInLayers = (args as { showInLayers?: unknown } | undefined)
      ?.showInLayers;
    if (typeof showInLayers !== 'boolean') {
      return false;
    }
    return Boolean(ctx.selection.primaryLayerId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const showInLayers = (args as { showInLayers?: unknown } | undefined)
      ?.showInLayers;
    const id = ctx.selection.primaryLayerId;
    if (!id || typeof showInLayers !== 'boolean') {
      return;
    }
    ctx.scene.apply({
      apply: (currentScene) => ({
        ...currentScene,
        pages: currentScene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, id, (l) => ({
            ...l,
            showInLayers,
          })),
        })),
      }),
      label: showInLayers ? 'Show layer in Layers' : 'Hide layer from Layers',
    });
    if (!showInLayers && isTemplatePolicyEnforced()) {
      const selection = ctx.scene.getSelection();
      const remaining = selection.selectedLayerIds.filter(
        (selectedId) => selectedId !== id
      );
      ctx.scene.selectLayers(remaining, remaining[0] ?? null);
    }
  }
}

type TemplatePolicyFlag = keyof Pick<
  TemplatePolicy,
  | 'allowDeleteLayers'
  | 'allowDuplicateLayers'
  | 'allowInsertLayers'
  | 'allowPageResize'
>;

const TEMPLATE_POLICY_FLAGS: TemplatePolicyFlag[] = [
  'allowDeleteLayers',
  'allowDuplicateLayers',
  'allowInsertLayers',
  'allowPageResize',
];

export class SetTemplatePolicyCommand extends Command {
  readonly id = 'scene.setTemplatePolicy';

  canExecute(_ctx: CommandContext, args?: unknown): boolean {
    const patch = args as
      | Partial<Record<TemplatePolicyFlag, unknown>>
      | undefined;
    if (!patch || typeof patch !== 'object') {
      return false;
    }
    return TEMPLATE_POLICY_FLAGS.some((key) => typeof patch[key] === 'boolean');
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const patch = args as
      | Partial<Record<TemplatePolicyFlag, unknown>>
      | undefined;
    if (!patch || typeof patch !== 'object') {
      return;
    }
    const updates: Partial<
      Pick<
        TemplatePolicy,
        | 'allowDeleteLayers'
        | 'allowDuplicateLayers'
        | 'allowInsertLayers'
        | 'allowPageResize'
      >
    > = {};
    for (const key of TEMPLATE_POLICY_FLAGS) {
      if (typeof patch[key] === 'boolean') {
        updates[key] = patch[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return;
    }
    ctx.scene.apply({
      apply: (currentScene) => {
        const prev = currentScene.templatePolicy;
        return {
          ...currentScene,
          templatePolicy: {
            version: 1,
            allowDeleteLayers: prev?.allowDeleteLayers ?? true,
            allowDuplicateLayers: prev?.allowDuplicateLayers ?? true,
            allowInsertLayers: prev?.allowInsertLayers ?? true,
            allowPageResize: prev?.allowPageResize ?? true,
            ...prev,
            ...updates,
          },
        };
      },
      label: 'Update embed template policy',
    });
  }
}

class UndoShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+Z';
  readonly commandId = 'scene.undo';
}

class RedoShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+Shift+Z';
  readonly commandId = 'scene.redo';
}

class MoveUpShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+ArrowUp';
  readonly commandId = 'scene.moveUp';
}

class MoveDownShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+ArrowDown';
  readonly commandId = 'scene.moveDown';
}

class ToggleLayerLockShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+L';
  readonly commandId = 'scene.toggleLayerLock';
  when = 'scene.layerSelected';
}

export class ScenePlugin extends Plugin {
  readonly id = 'OpenEnvx.scene';

  activate(ctx: PluginContext): void {
    ctx.register(
      new UndoCommand(),
      new RedoCommand(),
      new DeleteLayerCommand(),
      new MoveUpCommand(),
      new MoveDownCommand(),
      new MoveLayerCommand(),
      new ToggleLayerLockCommand(),
      new ToggleLayerVisibilityCommand(),
      new AddPageCommand(),
      new RemovePageCommand(),
      new DuplicatePageCommand(),
      new RenamePageCommand(),
      new RenameLayerCommand(),
      new SetLayerWriteModeCommand(),
      new SetLayerShowInLayersCommand(),
      new SetTemplatePolicyCommand(),
      new UndoShortcut(),
      new RedoShortcut(),
      new MoveUpShortcut(),
      new MoveDownShortcut(),
      new ToggleLayerLockShortcut()
    );
  }
}

export { reorderLayers, moveLayerToIndex };
