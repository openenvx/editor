import { createServiceId } from '@openenvx/core';

import type { CanvasClipboardService } from './clipboard/canvas-clipboard-service';
import type { CanvasCommandRequestService } from './commands/canvas-command-request-service';
import type { CanvasGridSettings } from './grid/canvas-grid-settings';
import type { PageResizeService } from './page-resize/page-resize-types';
import type { CanvasRegistriesReader } from './registry/canvas-registries-reader';
import type { CanvasRulerGuidesSettings } from './rulers/canvas-ruler-guides-settings';
import type { CanvasStageInteractionService } from './stage/canvas-stage-interaction';

export const CanvasClipboardServiceId =
  createServiceId<CanvasClipboardService>('canvasClipboard');
export const CanvasCommandRequestServiceId =
  createServiceId<CanvasCommandRequestService>('canvasCommandRequests');
export const CanvasRegistriesServiceId =
  createServiceId<CanvasRegistriesReader>('canvasRegistries');
export const CanvasStageInteractionServiceId =
  createServiceId<CanvasStageInteractionService>('canvasStageInteraction');
export const CanvasPageResizeServiceId =
  createServiceId<PageResizeService>('canvasPageResize');
export const CanvasGridSettingsServiceId =
  createServiceId<CanvasGridSettings>('canvasGridSettings');
export const CanvasRulerGuidesSettingsServiceId =
  createServiceId<CanvasRulerGuidesSettings>('canvasRulerGuidesSettings');
