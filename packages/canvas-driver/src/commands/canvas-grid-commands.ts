import { Command } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import { CanvasGridSettingsServiceId } from '../canvas-service-tokens';

export const CANVAS_GRID_SIZE_PRESETS = [4, 8, 16, 32] as const;

function getGridSettings(ctx: CommandContext) {
  if (!ctx.services.has(CanvasGridSettingsServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasGridSettingsServiceId);
}

function parseGridSizeArgs(args: unknown): number | null {
  if (typeof args === 'number' && Number.isFinite(args)) {
    return args;
  }
  if (
    args &&
    typeof args === 'object' &&
    'size' in args &&
    typeof (args as { size: unknown }).size === 'number' &&
    Number.isFinite((args as { size: number }).size)
  ) {
    return (args as { size: number }).size;
  }
  return null;
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

export class SetCanvasGridSizeCommand extends Command {
  readonly id = 'canvas.setGridSize';

  canExecute(ctx: CommandContext): boolean {
    return getGridSettings(ctx) !== null;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const size = parseGridSizeArgs(args);
    if (size === null || size === undefined) {
      return;
    }
    getGridSettings(ctx)?.setSize(size);
  }
}
