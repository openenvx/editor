import { Command, localize } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import type { PageGuide, PageGuideOrientation } from '@xmazu/openenvxee-schema';

import { CanvasRulerGuidesSettingsServiceId } from '../canvas-service-tokens';

function getRulerGuidesSettings(ctx: CommandContext) {
  if (!ctx.services.has(CanvasRulerGuidesSettingsServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasRulerGuidesSettingsServiceId);
}

function mapActivePageGuides(
  ctx: CommandContext,
  nextGuides: PageGuide[] | undefined,
  label: string
): void {
  const activePageId = ctx.scene.getActivePageId();
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      pages: scene.pages.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              guides:
                nextGuides && nextGuides.length > 0 ? nextGuides : undefined,
            }
          : page
      ),
    }),
    label,
  });
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
    return (ctx.scene.getActivePage().guides?.length ?? 0) > 0;
  }

  execute(ctx: CommandContext): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    mapActivePageGuides(
      ctx,
      undefined,
      localize(ctx.services, 'canvas.history.clearGuides', {
        defaultValue: 'Clear guides',
      })
    );
  }
}

export class AddCanvasGuideCommand extends Command {
  readonly id = 'canvas.addGuide';

  canExecute(_ctx: CommandContext): boolean {
    return true;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const input = args as
      | { orientation?: PageGuideOrientation; position?: number; id?: string }
      | undefined;
    if (
      !input ||
      (input.orientation !== 'horizontal' &&
        input.orientation !== 'vertical') ||
      typeof input.position !== 'number' ||
      !Number.isFinite(input.position)
    ) {
      return;
    }
    const page = ctx.scene.getActivePage();
    const guide: PageGuide = {
      id: input.id ?? crypto.randomUUID(),
      orientation: input.orientation,
      position: input.position,
    };
    mapActivePageGuides(
      ctx,
      [...(page.guides ?? []), guide],
      localize(ctx.services, 'canvas.history.addGuide', {
        defaultValue: 'Add guide',
      })
    );
  }
}

export class MoveCanvasGuideCommand extends Command {
  readonly id = 'canvas.moveGuide';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const guideId = (args as { guideId?: string } | undefined)?.guideId;
    if (!guideId) {
      return false;
    }
    return (ctx.scene.getActivePage().guides ?? []).some(
      (g) => g.id === guideId
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const input = args as { guideId?: string; position?: number } | undefined;
    if (
      !input?.guideId ||
      typeof input.position !== 'number' ||
      !Number.isFinite(input.position)
    ) {
      return;
    }
    const page = ctx.scene.getActivePage();
    const guides = page.guides ?? [];
    if (!guides.some((g) => g.id === input.guideId)) {
      return;
    }
    mapActivePageGuides(
      ctx,
      guides.map((guide) =>
        guide.id === input.guideId
          ? { ...guide, position: input.position as number }
          : guide
      ),
      localize(ctx.services, 'canvas.history.moveGuide', {
        defaultValue: 'Move guide',
      })
    );
  }
}

export class RemoveCanvasGuideCommand extends Command {
  readonly id = 'canvas.removeGuide';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const guideId = (args as { guideId?: string } | undefined)?.guideId;
    if (!guideId) {
      return false;
    }
    return (ctx.scene.getActivePage().guides ?? []).some(
      (g) => g.id === guideId
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const guideId = (args as { guideId?: string } | undefined)?.guideId;
    if (!guideId) {
      return;
    }
    const page = ctx.scene.getActivePage();
    const guides = page.guides ?? [];
    if (!guides.some((g) => g.id === guideId)) {
      return;
    }
    mapActivePageGuides(
      ctx,
      guides.filter((guide) => guide.id !== guideId),
      localize(ctx.services, 'canvas.history.removeGuide', {
        defaultValue: 'Remove guide',
      })
    );
  }
}
