import { Command } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import {
  HTML_ZOOM_MAX,
  HTML_ZOOM_MIN,
  type HtmlDevicePreset,
} from '../editor/html-device-preview';
import {
  HtmlPreviewChromeServiceId,
  type HtmlPreviewChromeService,
} from '../preview/html-preview-chrome-service';

function getChrome(ctx: CommandContext): HtmlPreviewChromeService | null {
  if (!ctx.services.has(HtmlPreviewChromeServiceId)) {
    return null;
  }
  const chrome = ctx.services.get(HtmlPreviewChromeServiceId);
  return chrome.isActive() ? chrome : null;
}

export class HtmlSetDevicePresetCommand extends Command {
  readonly id = 'html.setDevicePreset';

  canExecute(ctx: CommandContext): boolean {
    return getChrome(ctx) !== null;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const chrome = getChrome(ctx);
    if (!chrome || !args || typeof args !== 'object') {
      return;
    }
    const preset = (args as { preset?: unknown }).preset;
    if (preset === 'mobile' || preset === 'desktop' || preset === 'fluid') {
      chrome.setPreset(preset satisfies HtmlDevicePreset);
    }
  }
}

export class HtmlZoomInCommand extends Command {
  readonly id = 'html.zoomIn';

  canExecute(ctx: CommandContext): boolean {
    const chrome = getChrome(ctx);
    return chrome !== null && chrome.getZoom() < HTML_ZOOM_MAX - 0.001;
  }

  execute(ctx: CommandContext): void {
    getChrome(ctx)?.zoomIn();
  }
}

export class HtmlZoomOutCommand extends Command {
  readonly id = 'html.zoomOut';

  canExecute(ctx: CommandContext): boolean {
    const chrome = getChrome(ctx);
    return chrome !== null && chrome.getZoom() > HTML_ZOOM_MIN + 0.001;
  }

  execute(ctx: CommandContext): void {
    getChrome(ctx)?.zoomOut();
  }
}

export class HtmlZoomAutoCommand extends Command {
  readonly id = 'html.zoomAuto';

  canExecute(ctx: CommandContext): boolean {
    return getChrome(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getChrome(ctx)?.zoomAuto();
  }
}

export class HtmlZoomPercentCommand extends Command {
  readonly id = 'html.zoomPercent';

  canExecute(ctx: CommandContext): boolean {
    return getChrome(ctx) !== null;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const chrome = getChrome(ctx);
    if (!chrome || !args || typeof args !== 'object') {
      return;
    }
    const zoom = (args as { zoom?: unknown }).zoom;
    if (typeof zoom === 'number') {
      chrome.zoomPercent(zoom);
    }
  }
}

export function createHtmlPreviewCommands(): Command[] {
  return [
    new HtmlSetDevicePresetCommand(),
    new HtmlZoomInCommand(),
    new HtmlZoomOutCommand(),
    new HtmlZoomAutoCommand(),
    new HtmlZoomPercentCommand(),
  ];
}
