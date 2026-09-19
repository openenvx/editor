import { createServiceId } from '@openenvx/studio/core';
import type { LengthUnit, Scene } from '@openenvx/studio/schema';

export type CanvasExportFormat = 'png' | 'jpg' | 'pdf';

export interface CanvasExportOptions {
  format: CanvasExportFormat;
  scale?: number;
  dpi?: number;
  quality?: number;
  background?: 'transparent' | 'white' | string;
  fileName?: string;
  /** When true, export throws if any image asset fails to load. Defaults to false in browser, true in Node. */
  strictAssets?: boolean;
  /**
   * Values for `{{{key}}}` tokens in layer data strings. Unknown keys stay as tokens.
   * Omit only when the raster should show raw tokens; for WYSIWYG with editor sample
   * preview, pass the same map you would use for `applyTemplateVariables` (e.g.
   * `buildSampleVariableValues(scene)` from `@openenvx/studio/schema`).
   */
  variables?: Record<string, string>;
}

export interface CanvasExportDimensions {
  widthPx: number;
  heightPx: number;
  pageUnit?: LengthUnit;
  pageDpi?: number;
  pagePresetId?: string;
}

export interface CanvasExportResult {
  mimeType: string;
  data: Uint8Array;
  dimensions: CanvasExportDimensions;
  fileName?: string;
  missingImageSrcs?: string[];
}

export interface CanvasDocumentExportService {
  exportDocument(
    scene: Scene,
    pageId: string,
    options: CanvasExportOptions
  ): Promise<CanvasExportResult>;
  supportsFormat(format: CanvasExportFormat): boolean;
}

export const CanvasDocumentExportServiceId =
  createServiceId<CanvasDocumentExportService>('canvasDocumentExport');
