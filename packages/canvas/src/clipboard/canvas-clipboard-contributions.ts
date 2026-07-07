import {
  Command,
  isLayerEditable,
  isLayerWritable,
  ShortcutContribution,
} from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import {
  canExecuteCanvasClipboard,
  canExecuteInternalPaste,
  executeCopyLayers,
  executeDuplicateLayers,
  executePasteExternalLayers,
  executePasteLayers,
} from './canvas-clipboard-commands';

function canExecuteWithSelection(ctx: CommandContext): boolean {
  if (!canExecuteCanvasClipboard(ctx)) {
    return false;
  }
  if (ctx.selection.selectedLayerIds.length === 0) {
    return false;
  }
  const scene = ctx.scene.getScene();
  return ctx.selection.selectedLayerIds.every((id) => {
    const layer =
      scene.pages
        .find((page) => page.id === scene.activePageId)
        ?.layers.find((l) => l.id === id) ?? null;
    return layer && isLayerEditable(layer);
  });
}

function canExecuteWithWritableSelection(ctx: CommandContext): boolean {
  if (!canExecuteWithSelection(ctx)) {
    return false;
  }
  const scene = ctx.scene.getScene();
  return ctx.selection.selectedLayerIds.every((id) => {
    const layer =
      scene.pages
        .find((page) => page.id === scene.activePageId)
        ?.layers.find((l) => l.id === id) ?? null;
    return layer && isLayerWritable(layer);
  });
}

export class CopyLayersCommand extends Command {
  readonly id = 'canvas.copy';

  canExecute(ctx: CommandContext): boolean {
    return canExecuteWithSelection(ctx);
  }

  async execute(ctx: CommandContext): Promise<void> {
    await executeCopyLayers(ctx);
  }
}

export class PasteLayersCommand extends Command {
  readonly id = 'canvas.paste';

  canExecute(ctx: CommandContext): boolean {
    return canExecuteInternalPaste(ctx);
  }

  async execute(ctx: CommandContext): Promise<void> {
    await executePasteLayers(ctx);
  }
}

export class PasteExternalLayersCommand extends Command {
  readonly id = 'canvas.pasteExternal';

  canExecute(ctx: CommandContext): boolean {
    return canExecuteCanvasClipboard(ctx);
  }

  async execute(ctx: CommandContext): Promise<void> {
    await executePasteExternalLayers(ctx);
  }
}

export class DuplicateLayersCommand extends Command {
  readonly id = 'canvas.duplicate';

  canExecute(ctx: CommandContext): boolean {
    return canExecuteWithWritableSelection(ctx);
  }

  async execute(ctx: CommandContext): Promise<void> {
    await executeDuplicateLayers(ctx);
  }
}

export class CopyLayersShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+C';
  readonly commandId = 'canvas.copy';
  when = 'page.layoutAbsolute && scene.layerSelected';
}

export class PasteLayersShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+V';
  readonly commandId = 'canvas.paste';
  when = 'page.layoutAbsolute';
}

export class DuplicateLayersShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+D';
  readonly commandId = 'canvas.duplicate';
  when = 'page.layoutAbsolute && scene.layerSelected';
}

export class DeleteLayerShortcut extends ShortcutContribution {
  readonly keybinding = 'Delete';
  readonly commandId = 'scene.deleteLayer';
  when = 'scene.layerSelected && !canvas.editingText';
}

export class BackspaceDeleteLayerShortcut extends ShortcutContribution {
  readonly keybinding = 'Backspace';
  readonly commandId = 'scene.deleteLayer';
  when = 'scene.layerSelected && !canvas.editingText';
}
