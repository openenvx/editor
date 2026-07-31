import type { Command } from '../contributions/command';
import type { CommandExecutionResult } from './command-result';
import type { CommandContext } from './types';
import type { EventBus } from './workbench-events';
import { WorkbenchEvents } from './workbench-events';

export class CommandService {
  private readonly commands = new Map<string, Command>();

  register(command: Command): void {
    if (this.commands.has(command.id)) {
      throw new Error(`Command already registered: ${command.id}`);
    }
    this.commands.set(command.id, command);
  }

  unregister(id: string): boolean {
    return this.commands.delete(id);
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return [...this.commands.values()];
  }

  canExecute(id: string, ctx: CommandContext, args?: unknown): boolean {
    const command = this.commands.get(id);
    if (!command) {
      return false;
    }
    return command.canExecute ? command.canExecute(ctx, args) : true;
  }

  async execute(
    id: string,
    ctx: CommandContext,
    events: EventBus,
    args?: unknown
  ): Promise<CommandExecutionResult> {
    const command = this.commands.get(id);
    if (!command) {
      return { executed: false };
    }
    if (!this.canExecute(id, ctx, args)) {
      return { executed: false };
    }
    const result = await command.execute(ctx, args);
    events.emit(WorkbenchEvents.DidExecuteCommand, { commandId: id, result });
    return { executed: true, result };
  }
}
