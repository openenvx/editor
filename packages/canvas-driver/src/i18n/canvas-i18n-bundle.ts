import { I18nContribution } from '@openenvx/core';
import type { I18nBundleRegistry } from '@openenvx/core';

import canvasEn from './locales/en/canvas-en';
import canvasPl from './locales/pl/canvas-pl';

export class CanvasI18nBundle extends I18nContribution {
  readonly sourceId = 'canvas';

  contribute(registry: I18nBundleRegistry): void {
    registry.bundle('en', { ...canvasEn });
    registry.bundle('pl', { ...canvasPl });
  }
}
