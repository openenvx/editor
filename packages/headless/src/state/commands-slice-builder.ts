import type { CommandsSlice } from '../workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

export function buildCommandsSlice(ctx: WorkbenchSliceContext): CommandsSlice {
  const registries = ctx.manager.getRegistries();
  const commandCtx = ctx.manager.createCommandContext();
  const commandStates: Record<string, { canExecute: boolean }> = {};
  for (const command of registries.commands.getAll()) {
    commandStates[command.id] = {
      canExecute: registries.commands.canExecute(command.id, commandCtx),
    };
  }
  return { commandStates };
}
