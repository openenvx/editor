import type { PluginContext } from '@openenvx/core';

import {
  CanvasGridSettingsServiceId,
  CanvasMarginsSettingsServiceId,
  CanvasRulerGuidesSettingsServiceId,
} from '../canvas-service-tokens';

export function bindCanvasDisplayContextKeys(ctx: PluginContext): () => void {
  const keys = ctx.contextKeys;
  const grid = ctx.services.has(CanvasGridSettingsServiceId)
    ? ctx.services.get(CanvasGridSettingsServiceId)
    : null;
  const rulers = ctx.services.has(CanvasRulerGuidesSettingsServiceId)
    ? ctx.services.get(CanvasRulerGuidesSettingsServiceId)
    : null;
  const margins = ctx.services.has(CanvasMarginsSettingsServiceId)
    ? ctx.services.get(CanvasMarginsSettingsServiceId)
    : null;

  const sync = () => {
    keys.setContext('canvas.gridEnabled', grid?.isEnabled() ?? false);
    keys.setContext('canvas.showRulers', rulers?.isShowRulers() ?? false);
    keys.setContext('canvas.showMargins', margins?.isShowMargins() ?? false);
  };

  const disposers = [
    grid?.subscribe(() => sync()),
    rulers?.subscribe(() => sync()),
    margins?.subscribe(() => sync()),
  ].filter(Boolean) as (() => void)[];

  sync();

  return () => {
    for (const dispose of disposers) {
      dispose();
    }
  };
}
