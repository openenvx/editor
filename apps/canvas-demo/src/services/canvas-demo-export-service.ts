import { createServiceId } from '@openenvx/core';

export interface ExportImageResult {
  mimeType: string;
  dataUrl: string;
}

export interface CanvasDemoExportConfig {
  /** Base URL for export service. Empty string uses same-origin `/api/export`. */
  exportServiceUrl: string | null;
}

export interface CanvasDemoExportService {
  getConfig: () => CanvasDemoExportConfig;
  getExportStatus: () => string | null;
  setExportStatus: (status: string | null) => void;
  getExportResult: () => ExportImageResult | null;
  setExportResult: (result: ExportImageResult | null) => void;
}

export const CanvasDemoExportServiceId =
  createServiceId<CanvasDemoExportService>('canvasDemoExport');

export class CanvasDemoExportServiceImpl implements CanvasDemoExportService {
  private exportStatus: string | null = null;
  private exportResult: ExportImageResult | null = null;

  constructor(private readonly config: CanvasDemoExportConfig) {}

  getConfig(): CanvasDemoExportConfig {
    return this.config;
  }

  getExportStatus(): string | null {
    return this.exportStatus;
  }

  setExportStatus(status: string | null): void {
    this.exportStatus = status;
  }

  getExportResult(): ExportImageResult | null {
    return this.exportResult;
  }

  setExportResult(result: ExportImageResult | null): void {
    this.exportResult = result;
  }
}
