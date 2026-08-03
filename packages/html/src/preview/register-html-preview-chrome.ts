import { SimpleServiceContribution } from '@openenvx/core';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import { createHtmlPreviewCommands } from '../commands/create-html-preview-commands';
import { HtmlToolbarContribution } from '../contributions/html-toolbar-contribution';
import {
  HtmlPreviewChromeServiceId,
  HtmlPreviewChromeServiceImpl,
} from './html-preview-chrome-service';

/**
 * Registers html preview chrome service, commands, and toolbar contribution once.
 * Safe to call from both HtmlBlocksPlugin and EmailBlocksPlugin.
 */
export function registerHtmlPreviewChrome(ctx: WorkbenchPluginContext): void {
  if (ctx.commands.get('html.setDevicePreset')) {
    return;
  }
  ctx.register(
    new SimpleServiceContribution(
      HtmlPreviewChromeServiceId,
      () => new HtmlPreviewChromeServiceImpl()
    ),
    ...createHtmlPreviewCommands()
  );
  ctx.registerWorkbench(new HtmlToolbarContribution());
}
