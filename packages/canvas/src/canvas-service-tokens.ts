import { createServiceId } from '@openenvx/core';
import type { FontService } from '@openenvx/core';

import type { CanvasClipboardService } from './clipboard/canvas-clipboard-service';
import type { CanvasCommandRequestService } from './commands/canvas-command-request-service';
import type { PageResizeService } from './page-resize/page-resize-types';
import type { CanvasRegistriesReader } from './registry/canvas-registries-reader';

export const CanvasClipboardServiceId =
  createServiceId<CanvasClipboardService>('canvasClipboard');
export const CanvasCommandRequestServiceId =
  createServiceId<CanvasCommandRequestService>('canvasCommandRequests');
export const CanvasRegistriesServiceId =
  createServiceId<CanvasRegistriesReader>('canvasRegistries');
export const CanvasFontServiceId = createServiceId<FontService>('canvasFonts');
export const CanvasPageResizeServiceId =
  createServiceId<PageResizeService>('canvasPageResize');
