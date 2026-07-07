import type { ShortcutContribution } from '../contributions/shortcut-contribution';
import type { CommandService } from './command-service';
import type { CommandContext } from './types';
import type { EventBus } from './workbench-events';

export class KeybindingService {
  private readonly bindings: ShortcutContribution[] = [];

  register(shortcut: ShortcutContribution): void {
    this.bindings.push(shortcut);
  }

  getAll(): ShortcutContribution[] {
    return [...this.bindings];
  }

  async handleKeyDown(
    event: KeyboardEvent,
    commandService: CommandService,
    ctx: CommandContext,
    events: EventBus,
    evaluateWhen: (when: string | undefined) => boolean
  ): Promise<boolean> {
    const key = formatKeybinding(event);
    const binding = this.bindings.find((b) => b.keybinding === key);
    if (!binding) {
      return false;
    }
    if (!evaluateWhen(binding.when)) {
      return false;
    }
    if (!commandService.canExecute(binding.commandId, ctx)) {
      return false;
    }
    event.preventDefault();
    const { executed } = await commandService.execute(
      binding.commandId,
      ctx,
      events
    );
    return executed;
  }
}

function formatKeybinding(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) {
    parts.push('Mod');
  }
  if (event.shiftKey) {
    parts.push('Shift');
  }
  if (event.altKey) {
    parts.push('Alt');
  }
  parts.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
  return parts.join('+');
}
