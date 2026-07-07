import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { createServiceId } from '@openenvx/core';
import type { LengthUnit, Scene } from '@openenvx/schema';

export type CanvasExportFormat = 'svg' | 'png' | 'jpg' | 'pdf';

export interface CanvasExportOptions {
  format: CanvasExportFormat;
  scale?: number;
  dpi?: number;
  quality?: number;
  background?: 'transparent' | 'white' | string;
  fileName?: string;
}

export interface CanvasExportDimensions {
  widthPx: number;
  heightPx: number;
  pageUnit?: LengthUnit;
  pageDpi?: number;
  pagePresetId?: string;
}

export interface CanvasExportFallback {
  requestedFormat: CanvasExportFormat;
  actualFormat: CanvasExportFormat;
  reason: string;
}

export interface CanvasExportResult {
  mimeType: string;
  data: Uint8Array;
  dimensions: CanvasExportDimensions;
  fileName?: string;
  fallback?: CanvasExportFallback;
}

export interface CanvasPreviewSvgSerializer {
  readonly kind: string;
  toSvgFragment(descriptor: LayerPreviewDescriptor, ctx: unknown): string;
}

export interface CanvasDocumentExportService {
  exportDocument(
    scene: Scene,
    pageId: string,
    options: CanvasExportOptions
  ): Promise<CanvasExportResult>;
  supportsFormat(format: CanvasExportFormat): boolean;
  registerPreviewSerializer(serializer: CanvasPreviewSvgSerializer): void;
}

export const CanvasDocumentExportServiceId =
  createServiceId<CanvasDocumentExportService>('canvasDocumentExport');
