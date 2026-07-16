import { Command } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import { CanvasRulerGuidesSettingsServiceId } from '../canvas-service-tokens';

function getRulerGuidesSettings(ctx: CommandContext) {
  if (!ctx.services.has(CanvasRulerGuidesSettingsServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasRulerGuidesSettingsServiceId);
}

export class ToggleCanvasRulersCommand extends Command {
  readonly id = 'canvas.toggleRulers';

  canExecute(ctx: CommandContext): boolean {
    return getRulerGuidesSettings(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getRulerGuidesSettings(ctx)?.toggleRulers();
  }
}

export class ClearCanvasGuidesCommand extends Command {
  readonly id = 'canvas.clearGuides';

  canExecute(ctx: CommandContext): boolean {
    const settings = getRulerGuidesSettings(ctx);
    if (!settings) {
      return false;
    }
    const page = ctx.scene.getActivePage();
    return settings.getGuidesForPage(page.id).length > 0;
  }

  execute(ctx: CommandContext): void {
    const settings = getRulerGuidesSettings(ctx);
    if (!settings) {
      return;
    }
    const page = ctx.scene.getActivePage();
    settings.clearPageGuides(page.id);
  }
}
