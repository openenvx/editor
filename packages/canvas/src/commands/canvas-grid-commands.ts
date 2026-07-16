import { Command } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import { CanvasGridSettingsServiceId } from '../canvas-service-tokens';

function getGridSettings(ctx: CommandContext) {
  if (!ctx.services.has(CanvasGridSettingsServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasGridSettingsServiceId);
}

export class ToggleCanvasGridCommand extends Command {
  readonly id = 'canvas.toggleGrid';

  canExecute(ctx: CommandContext): boolean {
    return getGridSettings(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getGridSettings(ctx)?.toggle();
  }
}
