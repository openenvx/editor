import { CanvasDocumentExportServiceId } from '@openenvx/canvas';
import type {
  CanvasDocumentExportService,
  CanvasExportFormat,
} from '@openenvx/canvas';
import { bytesToDataUrl, downloadBytes } from '@openenvx/canvas/export-bytes';
import {
  AssetServiceId,
  Command,
  getActivePage,
  LayerRegistryServiceId,
} from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import { flattenSceneToIR } from '@openenvx/driver-image';
import {
  StatusBarContribution,
  type StatusBarBuilder,
} from '@openenvx/headless';
import type { Scene } from '@openenvx/schema';

import { CanvasDemoExportServiceId } from '../services/canvas-demo-export-service';
import type { CanvasDemoExportService } from '../services/canvas-demo-export-service';
import {
  downloadBlob,
  exportViaService,
} from '../services/export-service-client';

export const CANVAS_DEMO_EXPORT_FORMATS = [
  'svg',
  'png',
  'jpg',
  'pdf',
] as const satisfies readonly CanvasExportFormat[];

export function canvasDemoExportCommandId(format: CanvasExportFormat): string {
  return `canvas-demo.export.${format}`;
}

function getExportService(ctx: CommandContext): CanvasDemoExportService | null {
  if (!ctx.services.has(CanvasDemoExportServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasDemoExportServiceId);
}

function getDocumentExporter(
  ctx: CommandContext
): CanvasDocumentExportService | undefined {
  if (!ctx.services.has(CanvasDocumentExportServiceId)) {
    return undefined;
  }
  return ctx.services.get(CanvasDocumentExportServiceId);
}

function prepareExportScene(ctx: CommandContext): Scene {
  const scene = structuredClone(ctx.scene.getScene());
  if (!ctx.services.has(AssetServiceId)) {
    return scene;
  }

  const assets = ctx.services.get(AssetServiceId);
  const referenced = assets.exportReferenced?.(scene);
  if (!referenced || Object.keys(referenced).length === 0) {
    return scene;
  }

  return { ...scene, assets: referenced };
}

function exportStatusLabel(
  format: CanvasExportFormat,
  fallback?: { actualFormat: CanvasExportFormat }
): string {
  if (fallback) {
    return `Exported ${fallback.actualFormat.toUpperCase()} (raster fallback)`;
  }
  return `Exported ${format.toUpperCase()}`;
}

export class CanvasDemoExportCommand extends Command {
  constructor(
    readonly id: string,
    private readonly format: CanvasExportFormat
  ) {
    super();
  }

  canExecute(ctx: CommandContext): boolean {
    const exportService = getExportService(ctx);
    if (exportService?.getConfig().exportServiceUrl !== null) {
      return true;
    }
    const exporter = getDocumentExporter(ctx);
    if (!exporter) {
      return false;
    }
    return exporter.supportsFormat(this.format);
  }

  async execute(ctx: CommandContext): Promise<void> {
    const exportService = getExportService(ctx);
    if (!exportService) {
      return;
    }

    const { exportServiceUrl } = exportService.getConfig();
    const exporter = getDocumentExporter(ctx);

    exportService.setExportStatus('Exporting…');
    exportService.setExportResult(null);

    try {
      const scene = prepareExportScene(ctx);
      const page = getActivePage(scene);

      if (exportServiceUrl !== null) {
        const layerRegistry = ctx.services.get(LayerRegistryServiceId);
        const document = flattenSceneToIR(scene, layerRegistry, page.id);
        const result = await exportViaService(exportServiceUrl, {
          document,
          format: this.format,
        });
        downloadBlob(result.blob, result.fileName);
        exportService.setExportStatus(`Exported ${this.format.toUpperCase()}`);
        return;
      }

      if (!exporter) {
        exportService.setExportStatus('Export unavailable');
        return;
      }

      const result = await exporter.exportDocument(scene, page.id, {
        format: this.format,
      });
      const previewMimeType =
        result.mimeType === 'image/jpeg' ? 'image/png' : result.mimeType;
      if (
        previewMimeType === 'image/png' ||
        previewMimeType === 'image/svg+xml'
      ) {
        exportService.setExportResult({
          dataUrl: bytesToDataUrl(result.data, result.mimeType),
          mimeType: previewMimeType,
        });
      }

      downloadBytes(
        result.data,
        result.mimeType,
        result.fileName ??
          `artboard.${this.format === 'jpg' ? 'jpg' : this.format}`
      );
      exportService.setExportStatus(
        exportStatusLabel(this.format, result.fallback)
      );
    } catch (error) {
      if (exportServiceUrl !== null && this.format === 'png' && exporter) {
        try {
          const scene = prepareExportScene(ctx);
          const page = getActivePage(scene);
          const result = await exporter.exportDocument(scene, page.id, {
            format: 'png',
          });
          exportService.setExportResult({
            dataUrl: bytesToDataUrl(result.data, result.mimeType),
            mimeType: 'image/png',
          });
          downloadBytes(
            result.data,
            result.mimeType,
            result.fileName ?? 'artboard.png'
          );
          exportService.setExportStatus('Exported PNG (local fallback)');
          return;
        } catch {
          // Fall through to the original error message.
        }
      }

      exportService.setExportStatus(
        error instanceof Error ? error.message : 'Export failed'
      );
      exportService.setExportResult(null);
    }
  }
}

export function createCanvasDemoExportCommands(): CanvasDemoExportCommand[] {
  return CANVAS_DEMO_EXPORT_FORMATS.map(
    (format) =>
      new CanvasDemoExportCommand(canvasDemoExportCommandId(format), format)
  );
}

export class CanvasDemoExportStatusBar extends StatusBarContribution {
  contribute(builder: StatusBarBuilder, ctx: CommandContext): void {
    const text = getExportService(ctx)?.getExportStatus();
    if (typeof text !== 'string' || text.length === 0) {
      return;
    }
    builder.left().text(text, {
      id: 'canvas-demo-export-status',
      priority: -20,
    });
  }
}
