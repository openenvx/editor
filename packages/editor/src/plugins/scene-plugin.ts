import type { NodeWriteMode, TemplatePolicy } from '@openenvx/editor/schema';
import { NODE_WRITE_MODES } from '@openenvx/editor/schema';
import { Command, ShortcutContribution, Plugin } from '@openenvx/studio';
import type { PluginContext, CommandContext } from '@openenvx/studio';

import { requireDocumentStore } from '../document-store-access';
import { reorderNodes, moveNodeToIndex } from '../scene/document-store';
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
  findNodeById,
  removeNodeFromTree,
  updateNodeInTree,
  walkNodes,
} from '../scene/layer-tree';
import {
  createBlankPageLike,
  createPageId,
  duplicatePageModel,
  duplicatePageName,
  nextPageName,
} from '../scene/page-ops';
import { getActiveArtboard } from '../scene/types';
import {
  AddVariableCommand,
  InsertVariableCommand,
  RemoveVariableCommand,
  ReorderVariablesCommand,
  UpdateVariableCommand,
} from './template-variable-commands';

export class UndoCommand extends Command {
  readonly id = 'scene.undo';

  canExecute(ctx: CommandContext): boolean {
    return requireDocumentStore(ctx).canUndo();
  }

  execute(ctx: CommandContext): void {
    requireDocumentStore(ctx).undo();
  }
}

export class RedoCommand extends Command {
  readonly id = 'scene.redo';

  canExecute(ctx: CommandContext): boolean {
    return requireDocumentStore(ctx).canRedo();
  }

  execute(ctx: CommandContext): void {
    requireDocumentStore(ctx).redo();
  }
}

export class DeleteLayerCommand extends Command {
  readonly id = 'scene.deleteLayer';

  canExecute(ctx: CommandContext): boolean {
    if (requireDocumentStore(ctx).getSession().selectedNodeIds.length === 0) {
      return false;
    }
    const scene = requireDocumentStore(ctx).getDocument();
    return requireDocumentStore(ctx)
      .getSession()
      .selectedNodeIds.every((id) => {
        const layer = findNodeById(scene, id);
        return layer && canDeleteLayer(layer, scene);
      });
  }

  execute(ctx: CommandContext): void {
    const ids = new Set(requireDocumentStore(ctx).getSession().selectedNodeIds);
    const activeArtboardId =
      requireDocumentStore(ctx).getSession().activeArtboardId;
    requireDocumentStore(ctx).apply({
      apply: (scene) => {
        const page = getActiveArtboard(scene, activeArtboardId);
        let layers = page.nodes;
        for (const id of ids) {
          layers = removeNodeFromTree(layers, id);
        }
        return {
          ...scene,
          artboards: scene.artboards.map((p) =>
            p.id === page.id ? { ...p, nodes: layers } : p
          ),
        };
      },
      label: 'Delete layers',
    });
    requireDocumentStore(ctx).setSession({
      activeArtboardId,
      primaryNodeId: null,
      selectedNodeIds: [],
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
    const page = requireDocumentStore(ctx).getActiveArtboard();
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id) {
      return false;
    }
    const layer = page.nodes.find((l) => l.id === id);
    if (!layer || !canReorderLayer(layer)) {
      return false;
    }
    const index = page.nodes.indexOf(layer);
    if (index === -1) {
      return false;
    }
    return this.direction === 'up' ? index > 0 : index < page.nodes.length - 1;
  }

  execute(ctx: CommandContext): void {
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id) {
      return;
    }
    const activeArtboardId =
      requireDocumentStore(ctx).getSession().activeArtboardId;
    requireDocumentStore(ctx).apply({
      apply: (scene) => {
        const page = getActiveArtboard(scene, activeArtboardId);
        return {
          ...scene,
          artboards: scene.artboards.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  nodes: reorderNodes(p.nodes, id, this.direction),
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
    const scene = requireDocumentStore(ctx).getDocument();
    const layer = findNodeById(scene, moveArgs.layerId);
    if (!layer || !canReorderLayer(layer)) {
      return false;
    }
    const page = getActiveArtboard(
      scene,
      requireDocumentStore(ctx).getSession().activeArtboardId
    );
    return page.nodes.some((l) => l.id === moveArgs.layerId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const moveArgs = args as MoveLayerArgs | undefined;
    if (!moveArgs?.layerId) {
      return;
    }
    requireDocumentStore(ctx).apply({
      apply: (scene) => {
        const page = getActiveArtboard(
          scene,
          requireDocumentStore(ctx).getSession().activeArtboardId
        );
        return {
          ...scene,
          artboards: scene.artboards.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  nodes: moveNodeToIndex(
                    p.nodes,
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
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id) {
      return false;
    }
    const scene = requireDocumentStore(ctx).getDocument();
    const layer = findNodeById(scene, id);
    return layer ? isLayerEditable(layer) : false;
  }

  execute(ctx: CommandContext): void {
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id) {
      return;
    }
    const scene = requireDocumentStore(ctx).getDocument();
    const layer = findNodeById(scene, id);
    if (!layer || !isLayerEditable(layer)) {
      return;
    }
    const nextLocked = !isLayerLocked(layer);
    requireDocumentStore(ctx).apply({
      apply: (currentScene) => ({
        ...currentScene,
        artboards: currentScene.artboards.map((page) => ({
          ...page,
          nodes: updateNodeInTree(page.nodes, id, (l) => ({
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
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id) {
      return false;
    }
    const scene = requireDocumentStore(ctx).getDocument();
    const layer = findNodeById(scene, id);
    return layer ? isLayerEditable(layer) : false;
  }

  execute(ctx: CommandContext): void {
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id) {
      return;
    }
    const scene = requireDocumentStore(ctx).getDocument();
    const layer = findNodeById(scene, id);
    if (!layer || !isLayerEditable(layer)) {
      return;
    }
    const nextVisible = !isLayerVisible(layer);
    requireDocumentStore(ctx).apply({
      apply: (currentScene) => ({
        ...currentScene,
        artboards: currentScene.artboards.map((page) => ({
          ...page,
          nodes: updateNodeInTree(page.nodes, id, (l) => ({
            ...l,
            visible: nextVisible,
          })),
        })),
      }),
      label: nextVisible ? 'Show layer' : 'Hide layer',
    });
    if (!nextVisible) {
      const selection = requireDocumentStore(ctx).getSession();
      const remaining = selection.selectedNodeIds.filter(
        (selectedId) => selectedId !== id
      );
      requireDocumentStore(ctx).selectNodes(remaining, remaining[0] ?? null);
    }
  }
}

export class AddPageCommand extends Command {
  readonly id = 'scene.addPage';

  canExecute(ctx: CommandContext): boolean {
    return canInsertLayers(requireDocumentStore(ctx).getDocument());
  }

  execute(ctx: CommandContext): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    const source = requireDocumentStore(ctx).getActiveArtboard();
    const pages = requireDocumentStore(ctx).getDocument().artboards;
    const newId = createPageId();
    const page = createBlankPageLike(
      source,
      newId,
      nextPageName(pages.map((p) => p.name))
    );
    requireDocumentStore(ctx).apply({
      apply: (scene) => ({
        ...scene,
        artboards: [...scene.artboards, page],
      }),
      activeArtboardId: newId,
      label: 'Add page',
    });
  }
}

export class RemovePageCommand extends Command {
  readonly id = 'scene.removePage';

  canExecute(ctx: CommandContext): boolean {
    const scene = requireDocumentStore(ctx).getDocument();
    if (scene.artboards.length <= 1) {
      return false;
    }
    if (scene.templatePolicy?.allowDeleteLayers === false) {
      return false;
    }
    const page = requireDocumentStore(ctx).getActiveArtboard();
    let allowed = true;
    walkNodes(page.nodes, (layer) => {
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
    const scene = requireDocumentStore(ctx).getDocument();
    const activeArtboardId = requireDocumentStore(ctx).getActiveArtboardId();
    const index = scene.artboards.findIndex((p) => p.id === activeArtboardId);
    if (index === -1) {
      return;
    }
    const neighbor = scene.artboards[index - 1] ?? scene.artboards[index + 1];
    if (!neighbor) {
      return;
    }
    requireDocumentStore(ctx).apply({
      apply: (current) => ({
        ...current,
        artboards: current.artboards.filter((p) => p.id !== activeArtboardId),
      }),
      activeArtboardId: neighbor.id,
      label: 'Delete page',
    });
  }
}

export class DuplicatePageCommand extends Command {
  readonly id = 'scene.duplicatePage';

  canExecute(ctx: CommandContext): boolean {
    const scene = requireDocumentStore(ctx).getDocument();
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
    const source = requireDocumentStore(ctx).getActiveArtboard();
    const newId = createPageId();
    const page = duplicatePageModel(
      source,
      newId,
      duplicatePageName(source.name)
    );
    requireDocumentStore(ctx).apply({
      apply: (scene) => {
        const index = scene.artboards.findIndex((p) => p.id === source.id);
        if (index === -1) {
          return { ...scene, artboards: [...scene.artboards, page] };
        }
        const artboards = [...scene.artboards];
        artboards.splice(index + 1, 0, page);
        return { ...scene, artboards };
      },
      activeArtboardId: newId,
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
    return requireDocumentStore(ctx)
      .getDocument()
      .artboards.some((p) => p.id === renameArgs.id);
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
    const page = requireDocumentStore(ctx)
      .getDocument()
      .artboards.find((p) => p.id === renameArgs.id);
    if (!page || page.name === trimmed) {
      return;
    }
    requireDocumentStore(ctx).apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((p) =>
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
    return Boolean(
      findNodeById(requireDocumentStore(ctx).getDocument(), renameArgs.id)
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const renameArgs = args as RenameLayerArgs | undefined;
    if (!renameArgs?.id || typeof renameArgs.name !== 'string') {
      return;
    }
    const scene = requireDocumentStore(ctx).getDocument();
    const layer = findNodeById(scene, renameArgs.id);
    if (!layer) {
      return;
    }
    const trimmed = renameArgs.name.trim();
    const nextName = trimmed || undefined;
    const currentName = layer.name?.trim() || undefined;
    if (currentName === nextName) {
      return;
    }
    requireDocumentStore(ctx).apply({
      apply: (currentScene) => ({
        ...currentScene,
        artboards: currentScene.artboards.map((page) => ({
          ...page,
          nodes: updateNodeInTree(page.nodes, renameArgs.id, (l) => {
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

function isLayerWriteMode(value: unknown): value is NodeWriteMode {
  return (
    typeof value === 'string' &&
    (NODE_WRITE_MODES as readonly string[]).includes(value)
  );
}

export class SetLayerWriteModeCommand extends Command {
  readonly id = 'scene.setLayerWriteMode';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const writeMode = (args as { writeMode?: unknown } | undefined)?.writeMode;
    if (!isLayerWriteMode(writeMode)) {
      return false;
    }
    return Boolean(requireDocumentStore(ctx).getSession().primaryNodeId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const writeMode = (args as { writeMode?: unknown } | undefined)?.writeMode;
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id || !isLayerWriteMode(writeMode)) {
      return;
    }
    requireDocumentStore(ctx).apply({
      apply: (currentScene) => ({
        ...currentScene,
        artboards: currentScene.artboards.map((page) => ({
          ...page,
          nodes: updateNodeInTree(page.nodes, id, (l) => ({
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
    return Boolean(requireDocumentStore(ctx).getSession().primaryNodeId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const showInLayers = (args as { showInLayers?: unknown } | undefined)
      ?.showInLayers;
    const id = requireDocumentStore(ctx).getSession().primaryNodeId;
    if (!id || typeof showInLayers !== 'boolean') {
      return;
    }
    requireDocumentStore(ctx).apply({
      apply: (currentScene) => ({
        ...currentScene,
        artboards: currentScene.artboards.map((page) => ({
          ...page,
          nodes: updateNodeInTree(page.nodes, id, (l) => ({
            ...l,
            showInLayers,
          })),
        })),
      }),
      label: showInLayers ? 'Show layer in Layers' : 'Hide layer from Layers',
    });
    if (!showInLayers && isTemplatePolicyEnforced()) {
      const selection = requireDocumentStore(ctx).getSession();
      const remaining = selection.selectedNodeIds.filter(
        (selectedId) => selectedId !== id
      );
      requireDocumentStore(ctx).selectNodes(remaining, remaining[0] ?? null);
    }
  }
}

type TemplatePolicyFlag = keyof Pick<
  TemplatePolicy,
  | 'allowDeleteLayers'
  | 'allowDuplicateLayers'
  | 'allowInsertLayers'
  | 'allowArtboardResize'
>;

const TEMPLATE_POLICY_FLAGS: TemplatePolicyFlag[] = [
  'allowDeleteLayers',
  'allowDuplicateLayers',
  'allowInsertLayers',
  'allowArtboardResize',
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
        | 'allowArtboardResize'
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
    requireDocumentStore(ctx).apply({
      apply: (currentScene) => {
        const prev = currentScene.templatePolicy;
        return {
          ...currentScene,
          templatePolicy: {
            version: 1,
            allowDeleteLayers: prev?.allowDeleteLayers ?? true,
            allowDuplicateLayers: prev?.allowDuplicateLayers ?? true,
            allowInsertLayers: prev?.allowInsertLayers ?? true,
            allowArtboardResize: prev?.allowArtboardResize ?? true,
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

/** Figma-like: Delete/Backspace removes selection (Layers or canvas/html/email). */
class DeleteLayerShortcut extends ShortcutContribution {
  readonly keybinding = 'Delete';
  readonly commandId = 'scene.deleteLayer';
  when = 'scene.layerSelected && !editor.editingText';
}

class BackspaceDeleteLayerShortcut extends ShortcutContribution {
  readonly keybinding = 'Backspace';
  readonly commandId = 'scene.deleteLayer';
  when = 'scene.layerSelected && !editor.editingText';
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
      new AddVariableCommand(),
      new UpdateVariableCommand(),
      new RemoveVariableCommand(),
      new ReorderVariablesCommand(),
      new InsertVariableCommand(),
      new UndoShortcut(),
      new RedoShortcut(),
      new MoveUpShortcut(),
      new MoveDownShortcut(),
      new ToggleLayerLockShortcut(),
      new DeleteLayerShortcut(),
      new BackspaceDeleteLayerShortcut()
    );
  }
}

export { reorderNodes, moveNodeToIndex };
