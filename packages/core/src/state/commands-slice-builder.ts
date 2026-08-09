import type { CommandsSlice } from '../workbench/workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

export function buildCommandsSlice(ctx: WorkbenchSliceContext): CommandsSlice {
  const registries = ctx.coreRegistries;
  const commandCtx = ctx.runtime.createCommandContext();
  const commandStates: Record<string, { canExecute: boolean }> = {};
  for (const command of registries.commands.getAll()) {
    commandStates[command.id] = {
      canExecute: registries.commands.canExecute(command.id, commandCtx),
    };
  }
  return { commandStates };
}
