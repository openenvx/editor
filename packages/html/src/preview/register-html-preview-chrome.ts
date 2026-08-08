import { SimpleServiceContribution } from '@openenvx/core';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import { createHtmlPreviewCommands } from '../commands/create-html-preview-commands';
import { HtmlToolbarContribution } from '../contributions/html-toolbar-contribution';
import type { HtmlDevicePreset } from '../editor/html-device-preview';
import {
  HtmlPreviewChromeServiceId,
  HtmlPreviewChromeServiceImpl,
} from './html-preview-chrome-service';

export interface RegisterHtmlPreviewChromeOptions {
  initialPreset?: HtmlDevicePreset;
  hideFluidPreset?: boolean;
  hideZoomControls?: boolean;
}

/** Merged across HtmlBlocksPlugin + EmailBlocksPlugin activations before first register. */
const mergedChromeOptions: RegisterHtmlPreviewChromeOptions = {};

/** Vitest: clear module-level merge state between cases. */
export function resetHtmlPreviewChromeOptionsForTests(): void {
  for (const key of Object.keys(
    mergedChromeOptions
  ) as (keyof RegisterHtmlPreviewChromeOptions)[]) {
    delete mergedChromeOptions[key];
  }
}

function applyHtmlPreviewChromeContextKeys(
  ctx: WorkbenchPluginContext,
  options: RegisterHtmlPreviewChromeOptions
): void {
  if (options.hideFluidPreset) {
    ctx.contextKeys.setContext('html.hideFluidPreset', true);
  }
  if (options.hideZoomControls) {
    ctx.contextKeys.setContext('html.hideZoomControls', true);
  }
}

/**
 * Registers html preview chrome service, commands, and toolbar contribution once.
 * Safe to call from both HtmlBlocksPlugin and EmailBlocksPlugin.
 *
 * Options from every call are merged before the first registration. Later calls
 * still apply `hideFluidPreset` / `hideZoomControls` context keys; service
 * construction runs only once (when `html.setDevicePreset` is not registered yet).
 */
export function registerHtmlPreviewChrome(
  ctx: WorkbenchPluginContext,
  options?: RegisterHtmlPreviewChromeOptions
): void {
  Object.assign(mergedChromeOptions, options);
  applyHtmlPreviewChromeContextKeys(ctx, mergedChromeOptions);
  if (ctx.commands.get('html.setDevicePreset')) {
    return;
  }
  ctx.register(
    new SimpleServiceContribution(
      HtmlPreviewChromeServiceId,
      () =>
        new HtmlPreviewChromeServiceImpl({
          initialPreset: mergedChromeOptions.initialPreset,
        })
    ),
    ...createHtmlPreviewCommands()
  );
  ctx.registerWorkbench(new HtmlToolbarContribution());
}
