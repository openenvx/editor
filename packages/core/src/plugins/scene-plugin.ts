import { Command } from '../contributions/command';
import { ShortcutContribution } from '../contributions/shortcut-contribution';
import { Plugin } from '../core/plugin';
import type { PluginContext } from '../core/plugin-manager';
import type { CommandContext } from '../runtime/types';
import {
  canDeleteLayer,
  canReorderLayer,
  isLayerEditable,
  isLayerLocked,
} from '../scene/layer-editability';
import {
  findLayerById,
  removeLayerFromTree,
  updateLayerInTree,
} from '../scene/layer-tree';
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
    ctx.scene.apply({
      apply: (scene) => {
        const page = getActivePage(scene);
        let layers = page.layers;
        for (const id of ids) {
          layers = removeLayerFromTree(layers, id);
        }
        return {
          ...scene,
          pages: scene.pages.map((p) =>
            p.id === page.id ? { ...p, layers } : p
          ),
          selection: {
            ...scene.selection,
            selectedLayerIds: [],
            primaryLayerId: null,
          },
        };
      },
      label: 'Delete layers',
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
    const page = getActivePage(ctx.scene.getScene());
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
    ctx.scene.apply({
      apply: (scene) => {
        const page = getActivePage(scene);
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
    const page = getActivePage(scene);
    return page.layers.some((l) => l.id === moveArgs.layerId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const moveArgs = args as MoveLayerArgs | undefined;
    if (!moveArgs?.layerId) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) => {
        const page = getActivePage(scene);
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
      new UndoShortcut(),
      new RedoShortcut(),
      new MoveUpShortcut(),
      new MoveDownShortcut(),
      new ToggleLayerLockShortcut()
    );
  }
}

export { reorderLayers, moveLayerToIndex };
