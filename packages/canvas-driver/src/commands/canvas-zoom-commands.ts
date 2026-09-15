import { Command, EditorViewportServiceId } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

function getViewport(ctx: CommandContext) {
  if (!ctx.services.has(EditorViewportServiceId)) {
    return null;
  }
  return ctx.services.get(EditorViewportServiceId).getViewport();
}

export class CanvasZoomInCommand extends Command {
  readonly id = 'canvas.zoomIn';

  canExecute(ctx: CommandContext): boolean {
    return getViewport(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getViewport(ctx)?.zoomIn();
  }
}

export class CanvasZoomOutCommand extends Command {
  readonly id = 'canvas.zoomOut';

  canExecute(ctx: CommandContext): boolean {
    return getViewport(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getViewport(ctx)?.zoomOut();
  }
}

export class CanvasZoomTo100Command extends Command {
  readonly id = 'canvas.zoomTo100';

  canExecute(ctx: CommandContext): boolean {
    return getViewport(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getViewport(ctx)?.zoomTo100();
  }
}

export class CanvasZoomToFitCommand extends Command {
  readonly id = 'canvas.zoomToFit';

  canExecute(ctx: CommandContext): boolean {
    return getViewport(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getViewport(ctx)?.zoomToFit();
  }
}

export class CanvasZoomResetCommand extends Command {
  readonly id = 'canvas.zoomReset';

  canExecute(ctx: CommandContext): boolean {
    return getViewport(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getViewport(ctx)?.reset();
  }
}
