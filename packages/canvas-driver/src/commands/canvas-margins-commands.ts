import { Command } from '@openenvx/studio';
import type { CommandContext } from '@openenvx/studio';

import { CanvasMarginsSettingsServiceId } from '../canvas-service-tokens';

function getMarginsSettings(ctx: CommandContext) {
  if (!ctx.services.has(CanvasMarginsSettingsServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasMarginsSettingsServiceId);
}

export class ToggleCanvasMarginsCommand extends Command {
  readonly id = 'canvas.toggleMargins';

  canExecute(ctx: CommandContext): boolean {
    return getMarginsSettings(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getMarginsSettings(ctx)?.toggle();
  }
}
