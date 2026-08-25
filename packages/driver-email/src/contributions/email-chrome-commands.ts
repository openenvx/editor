import {
  Command,
  DocumentHostServiceId,
  DocumentOperationsServiceId,
  ShellUiServiceId,
  type CommandContext,
} from '@openenvx/core';

export const WORKBENCH_SAVE_COMMAND_ID = 'workbench.save';
export const WORKBENCH_SAVE_AS_COMMAND_ID = 'workbench.saveAs';
export const WORKBENCH_OPEN_COMMAND_ID = 'workbench.open';
export const WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID =
  'workbench.commandPalette.toggle';

function getDocumentHost(ctx: CommandContext) {
  if (!ctx.services.has(DocumentHostServiceId)) {
    return null;
  }
  return ctx.services.get(DocumentHostServiceId);
}

function getDocumentOperations(ctx: CommandContext) {
  if (!ctx.services.has(DocumentOperationsServiceId)) {
    return null;
  }
  return ctx.services.get(DocumentOperationsServiceId);
}

class WorkbenchSaveCommand extends Command {
  readonly id = WORKBENCH_SAVE_COMMAND_ID;

  async execute(ctx: CommandContext): Promise<void> {
    await getDocumentOperations(ctx)?.save();
  }
}

class WorkbenchSaveAsCommand extends Command {
  readonly id = WORKBENCH_SAVE_AS_COMMAND_ID;

  canExecute(ctx: CommandContext): boolean {
    return getDocumentHost(ctx)?.canPromptSaveAs() ?? false;
  }

  async execute(ctx: CommandContext): Promise<void> {
    const host = getDocumentHost(ctx);
    const operations = getDocumentOperations(ctx);
    if (!host || !operations) {
      return;
    }
    const uri = await host.promptSaveAs();
    if (uri) {
      await operations.saveAs(uri);
    }
  }
}

class WorkbenchOpenCommand extends Command {
  readonly id = WORKBENCH_OPEN_COMMAND_ID;

  canExecute(ctx: CommandContext): boolean {
    return getDocumentHost(ctx)?.canPromptOpen() ?? false;
  }

  async execute(ctx: CommandContext): Promise<void> {
    const host = getDocumentHost(ctx);
    const operations = getDocumentOperations(ctx);
    if (!host || !operations) {
      return;
    }
    const uri = await host.promptOpen();
    if (uri) {
      await operations.openDocument(uri);
    }
  }
}

class ToggleCommandPaletteCommand extends Command {
  readonly id = WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID;

  execute(ctx: CommandContext): void {
    if (!ctx.services.has(ShellUiServiceId)) {
      return;
    }
    ctx.services.get(ShellUiServiceId).toggleCommandPalette();
  }
}

export function createEmailChromeCommands(): Command[] {
  return [
    new WorkbenchSaveCommand(),
    new WorkbenchSaveAsCommand(),
    new WorkbenchOpenCommand(),
    new ToggleCommandPaletteCommand(),
  ];
}
